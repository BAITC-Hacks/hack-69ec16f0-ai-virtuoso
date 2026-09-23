import { test, expect, type Locator } from "@playwright/test";
import type { ConfigResponse } from "../lib/types";

// Concave districts can have a bounding-box center outside their painted area.
async function interiorPoint(region: Locator) {
  return region.evaluate((element) => {
    const path = element as SVGPathElement;
    const box = path.getBBox();
    const matrix = path.getScreenCTM()!;
    for (let y = box.y + box.height / 2; y < box.y + box.height; y += 1) {
      for (let x = box.x + box.width / 3; x < box.x + box.width; x += 1) {
        const point = new DOMPoint(x, y);
        if (path.isPointInFill(point)) {
          const screen = point.matrixTransform(matrix);
          return { x: screen.x, y: screen.y };
        }
      }
    }
    throw new Error("No painted point found");
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/simulator");
  await expect(page.getByRole("region", { name: "Карта районов Астаны" })).toBeVisible();
});

test("all five shapes are clickable and assets load without viewport overflow", async ({ page }, testInfo) => {
  const map = page.getByRole("region", { name: "Карта районов Астаны" });
  const regions = page.locator(".city-map-region");
  await expect(regions).toHaveCount(5);
  await expect(page.locator('.city-map-image[data-active="true"]')).toHaveAttribute("href", "/map_icons/map.svg");
  for (let index = 0; index < 5; index++) {
    const region = regions.nth(index);
    await region.scrollIntoViewIfNeeded();
    const point = await interiorPoint(region);
    if (testInfo.project.name === "mobile") await page.touchscreen.tap(point.x, point.y);
    else await page.mouse.click(point.x, point.y);
    await expect(region).toHaveAttribute("aria-pressed", "true");
    expect(await region.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("none");
  }
  for (const asset of ["map", "map_yesil", "map_almaty", "map_nura", "map_baykonyr", "map_saryarka"]) {
    const response = await page.request.get(`/map_icons/${asset}.svg`);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.getByRole("button", { name: "Район Нура", exact: true }).click();
  await expect(page.locator('.city-map-image[data-active="true"]')).toHaveAttribute("href", "/map_icons/map_nura.svg");
  await expect(page.locator('.city-map-image[data-active="true"]')).toHaveCSS("opacity", "1");
  await map.screenshot({ path: testInfo.outputPath("city-map.png") });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("simulator.png") });
});

test("map defaults preserve saved decisions, overrides and city-wide projects", async ({ page }) => {
  const bus = page.locator("article").filter({ hasText: "Выделенные полосы" });
  const park = page.locator("article").filter({ hasText: "Парк / сквер" });
  const lights = page.locator("article").filter({ hasText: "Умные светофоры" });
  await page.getByRole("button", { name: "Район Нура", exact: true }).click();
  await expect(bus.getByRole("combobox")).toHaveValue("Нура");
  await bus.getByRole("button", { name: "Добавить проект" }).click();
  await park.getByRole("combobox").selectOption("Есиль");
  await page.getByRole("button", { name: "Район Алматы", exact: true }).click();
  await expect(bus.getByRole("combobox")).toHaveValue("Нура");
  await expect(bus.getByRole("combobox")).toBeDisabled();
  await expect(park.getByRole("combobox")).toHaveValue("Есиль");
  await expect(lights.getByRole("combobox")).toHaveCount(0);
  await lights.getByRole("button", { name: "Добавить проект" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await expect(page.getByText("Для всего города: 1")).toBeVisible();
  const thumbnail = page.locator('aside img[src="/map_icons/map_nura.svg"]');
  await expect(thumbnail).toBeVisible();
  expect(await thumbnail.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Очистить сценарий" }).click();
  await expect(page.locator('.city-map-region[aria-pressed="true"]')).toHaveCount(0);
  await expect(bus.getByRole("combobox")).toHaveValue("");
});

test("keyboard selection and clearing update unassigned projects", async ({ page }) => {
  const region = page.getByRole("button", { name: "Выбрать район Сарыарка", exact: true });
  await region.focus();
  await page.keyboard.press("Enter");
  await expect(region).toHaveAttribute("aria-pressed", "true");
  const bus = page.locator("article").filter({ hasText: "Выделенные полосы" });
  await expect(bus.getByRole("combobox")).toHaveValue("Сарыарка");
  await page.getByRole("button", { name: "Снять выбор" }).click();
  await expect(bus.getByRole("combobox")).toHaveValue("");
  await expect(bus.getByRole("button", { name: "Добавить проект" })).toBeDisabled();
});

test("submitted districts and result scores agree with the map", async ({ page }) => {
  const configResponse = await page.request.get("http://localhost:8000/api/v1/config/");
  const config: ConfigResponse = await configResponse.json();
  const result = structuredClone(config.baseline);
  result.score += 1;
  result.delta = 1;
  result.districts["Нура"].score += 1;
  await page.route("**/scenarios/simulate/", async (route) => {
    expect(route.request().postDataJSON().decisions).toEqual([
      { measure_id: "M1", district: "Нура" },
      { measure_id: "M2", district: null },
      { measure_id: "M4", district: "Нура" },
      { measure_id: "M10", district: "Нура" },
      { measure_id: "M12", district: null },
    ]);
    await route.fulfill({ json: { id: 1, valid: true, spent_budget: 81, remaining_budget: 19, result, analysis_url: "/api/v1/scenarios/1/analysis/" } });
  });
  await page.route("**/scenarios/1/analysis/", (route) => route.fulfill({ json: { ai_mode: "fallback", summary: "Тестовый разбор", trade_off: "", recommendations: [] } }));
  await page.getByRole("button", { name: "Район Нура", exact: true }).click();
  for (const name of ["Выделенные полосы", "Умные светофоры", "Парк / сквер", "Освещение и камеры", "Единая цифровая платформа"]) {
    await page.locator("article").filter({ hasText: name }).getByRole("button", { name: "Добавить проект" }).click();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.getByRole("button", { name: /^(Запустить симуляцию|Рассчитать)$/ }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Результат", exact: true })).toBeVisible();
  await expect(page.getByText("Оценка города · после")).toBeVisible();
  const score = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(result.districts["Нура"].score);
  await expect(page.getByRole("button", { name: "Район Нура", exact: true })).toContainText(score);
});
