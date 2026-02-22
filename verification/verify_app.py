from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    print("Navigating to home page...")
    try:
        page.goto("http://localhost:3000", timeout=30000)
    except Exception as e:
        print(f"Failed to load page: {e}")
        browser.close()
        return

    print("Waiting for clubs to load...")
    try:
        # Wait for at least one club card to appear
        page.wait_for_selector("a[href^='/club/']", timeout=15000)

        # Take a screenshot of the home page
        page.screenshot(path="verification/home_page.png")
        print("Home page screenshot taken.")

        print("Clicking on the first club...")
        # Click the first club card
        page.click("a[href^='/club/'] >> nth=0")

        print("Waiting for detail page...")
        # Wait for the club name heading
        page.wait_for_selector("h1", timeout=15000)

        print("Waiting for courses...")
        # Wait for course buttons or "No courses" message
        # We wait for the container that holds courses or the table
        page.wait_for_timeout(5000) # Give time for async fetches

        # Take a screenshot of the detail page
        page.screenshot(path="verification/detail_page.png", full_page=True)
        print("Detail page screenshot taken.")
    except Exception as e:
        print(f"Error during verification: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
