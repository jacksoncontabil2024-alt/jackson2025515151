import asyncio, os
from playwright.async_api import async_playwright

OUT = "/app/frontend/public/downloads/pngs"
os.makedirs(OUT, exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={"width": 1920, "height": 1080})
        for i in range(1, 22):
            await page.goto(f"http://localhost:3000/?bare=1#{i}", wait_until="networkidle")
            await page.wait_for_timeout(1800)
            await page.screenshot(path=f"{OUT}/slide-{i:02d}.png")
            print("slide", i, "ok", flush=True)
        await b.close()

asyncio.run(main())
