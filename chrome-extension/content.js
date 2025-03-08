// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProblemDetails') {
    const problemDetails = extractProblemDetails();
    sendResponse(problemDetails);
  }
  return true;
});

// Extract problem details from the page
function extractProblemDetails() {
  try {
    // Get problem title - try multiple possible selectors
    let title = '';
    const titleSelectors = [
      // New specific selector
      '#\\37 4bda7d9-3be8-3ae0-8b01-03b0e72579fc > div > div.flex.w-full.flex-1.flex-col.gap-4.overflow-y-auto.px-4.py-5 > div.flex.items-start.justify-between.gap-4',
      // More generic selectors that might match
      'div[class*="flex items-start justify-between"]',
      'div[class*="title_"]',
      '[data-cy="question-title"]',
      '.mr-2.text-lg',
      'div[class*="css"] h4',
      'h4[class*="title"]'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        title = element.textContent.trim();
        if (title) {
          console.log('Found title using selector:', selector);
          break;
        }
      }
    }

    // Get problem description - try multiple possible selectors
    let description = '';
    const descriptionSelectors = [
      // Try to find the description relative to the title
      'div[class*="content_"]',
      '[data-cy="question-content"]',
      'div[class*="content__"]',
      'div[class*="description_"]',
      'div[class*="content_"] div[class*="question-content"]'
    ];

    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        description = element.textContent.trim();
        if (description) {
          console.log('Found description using selector:', selector);
          break;
        }
      }
    }

    // Get code (if any is written)
    let code = '';
    const codeSelectors = [
      '.monaco-editor',
      'div[class*="editor_"] textarea',
      'div[class*="code-area_"] textarea'
    ];

    for (const selector of codeSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        if (element.tagName.toLowerCase() === 'textarea') {
          code = element.value.trim();
        } else {
          const codeLines = element.querySelectorAll('.view-line');
          code = Array.from(codeLines)
            .map(line => line.textContent)
            .join('\n')
            .trim();
        }
        if (code) {
          console.log('Found code using selector:', selector);
          break;
        }
      }
    }

    console.log('Extracted details:', { 
      title, 
      description: description.substring(0, 100) + '...', 
      code: code.substring(0, 100) + '...' 
    });

    return {
      title,
      description,
      code,
      success: true
    };
  } catch (error) {
    console.error('Error extracting problem details:', error);
    return {
      title: '',
      description: '',
      code: '',
      success: false,
      error: error.message
    };
  }
} 