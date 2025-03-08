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
      '[data-cy="question-title"]',
      'div[class*="title_"] div',
      '.mr-2.text-lg',
      'div[class*="css"] h4',
      'h4[class*="title"]'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        title = element.textContent.trim();
        if (title) break;
      }
    }

    // Get problem description - try multiple possible selectors
    let description = '';
    const descriptionSelectors = [
      '[data-cy="question-content"]',
      'div[class*="content__"]',
      'div[class*="description_"]',
      'div[class*="content_"] div[class*="question-content"]'
    ];

    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        description = element.textContent.trim();
        if (description) break;
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
        if (code) break;
      }
    }

    console.log('Extracted details:', { title, description: description.substring(0, 100) + '...', code: code.substring(0, 100) + '...' });

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