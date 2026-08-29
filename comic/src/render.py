import asyncio, sys
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args=['--font-render-hinting=none','--force-color-profile=srgb'])
        pg = await b.new_page(viewport={'width':794,'height':1123}, device_scale_factor=3.13)
        await pg.goto('file:///tmp/claude-0/-home-user-Reut1/56206ecb-513d-51d8-a7a2-c3993985247b/scratchpad/build/page.html')
        await pg.wait_for_timeout(2500)
        el = await pg.query_selector('.page')
        await el.screenshot(path='/tmp/claude-0/-home-user-Reut1/56206ecb-513d-51d8-a7a2-c3993985247b/scratchpad/build/yesh-lecha-bayit.png')
        await pg.pdf(path='/tmp/claude-0/-home-user-Reut1/56206ecb-513d-51d8-a7a2-c3993985247b/scratchpad/build/yesh-lecha-bayit.pdf',
                     width='210mm', height='297mm', print_background=True, margin={'top':'0','bottom':'0','left':'0','right':'0'})
        await b.close()
asyncio.run(main())
print('rendered')
