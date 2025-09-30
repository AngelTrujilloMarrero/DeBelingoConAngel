from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Verifies that the navigation menu is visible on page load.
    - Navigates to the homepage.
    - Waits for the content to load.
    - Takes a screenshot of the top of the page.
    """
    # Navigate to the local development server
    page.goto("http://localhost:5173/")

    # Wait for the loading indicator to disappear to ensure the page is fully rendered
    loading_indicator = page.get_by_role("heading", name="Cargando Verbenas de Tenerife...")
    expect(loading_indicator).to_be_hidden(timeout=30000)

    # Find the navigation bar
    nav_bar = page.get_by_role("navigation")
    expect(nav_bar).to_be_visible()

    # Take a screenshot to visually verify the result
    page.screenshot(path="jules-scratch/verification/verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_verification(page)
            print("Verification script completed successfully.")
        except Exception as e:
            print(f"An error occurred during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    main()