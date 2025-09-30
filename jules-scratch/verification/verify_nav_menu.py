from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Verifies the functionality of the navigation menu.
    - Navigates to the homepage.
    - Waits for the content to load.
    - Clicks the 'Mapa' link.
    - Programmatically scrolls the map section into view to ensure visibility.
    - Takes a screenshot for visual confirmation.
    """
    # Navigate to the local development server
    page.goto("http://localhost:5173/")

    # Wait for the loading indicator to disappear
    loading_indicator = page.get_by_role("heading", name="Cargando Verbenas de Tenerife...")
    expect(loading_indicator).to_be_hidden(timeout=30000)

    # Click the "Mapa" link to initiate the scroll
    map_link = page.get_by_role("link", name="Mapa")
    expect(map_link).to_be_visible()
    map_link.click()

    # Target the map section itself
    map_section = page.locator("#map")

    # Use Playwright's own scroll command for reliability in the test environment
    map_section.scroll_into_view_if_needed()

    # Now that the section is programmatically in view, assert its heading is visible
    map_section_heading = page.get_by_text("UBICACIÓN APROXIMADA DE LAS VERBENAS")
    expect(map_section_heading).to_be_in_viewport(timeout=5000)

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