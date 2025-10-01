from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.goto("http://localhost:5173/")

    # Wait for the main title to be visible to ensure the header has loaded
    h1 = page.locator('h1:has-text("DE BELINGO CON ÁNGEL")')
    expect(h1).to_be_visible(timeout=15000)

    # Take a full page screenshot to capture header and footer
    page.screenshot(path="jules-scratch/verification/verification.png", full_page=True)
    browser.close()

with sync_playwright() as playwright:
    run(playwright)