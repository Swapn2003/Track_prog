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
    // Get problem title
    const titleElement = document.querySelector('[data-cy="question-title"]');
    const title = titleElement ? titleElement.textContent.trim() : '';

    // Get problem description
    const descriptionElement = document.querySelector('[data-cy="question-content"]');
    const description = descriptionElement ? descriptionElement.textContent.trim() : '';

    // Get code (if any is written)
    const codeElement = document.querySelector('.monaco-editor');
    let code = '';
    if (codeElement) {
      const codeLines = codeElement.querySelectorAll('.view-line');
      code = Array.from(codeLines)
        .map(line => line.textContent)
        .join('\n')
        .trim();
    }

    // If no title is found, try alternative selectors
    if (!title) {
      const altTitleElement = document.querySelector('.mr-2.text-lg');
      if (altTitleElement) {
        title = altTitleElement.textContent.trim();
      }
    }

    // If no description is found, try alternative selectors
    if (!description) {
      const altDescriptionElement = document.querySelector('div[class*="content__"]');
      if (altDescriptionElement) {
        description = altDescriptionElement.textContent.trim();
      }
    }

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