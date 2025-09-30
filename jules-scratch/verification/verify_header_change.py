from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("http://localhost:5173/")

    # Wait for the header to be visible to ensure the page has loaded
    page.wait_for_selector("header")

    # Take a screenshot of the header area
    header = page.query_selector("header")
    if header:
        header.screenshot(path="jules-scratch/verification/verification.png")
    else:
        page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)