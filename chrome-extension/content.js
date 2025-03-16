// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProblemDetails') {
    try {
      // Extract problem details using multiple methods
      const details = extractProblemDetails();
      
      // Log the extracted details
      console.log('Extracted problem details:', { 
        title: details.title || 'Not found', 
        descriptionLength: details.description.length,
        codeLength: details.code.length
      });
      
      sendResponse(details);
    } catch (error) {
      console.error('Error extracting problem details:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
  return true; // Keep the message channel open for async response
});

// Extract problem details from the page
function extractProblemDetails() {
  try {
    // Get problem title - try multiple possible selectors
    let title = '';
    
    // Method 1: Try specific selectors
    const titleSelectors = [
      // Specific selector provided by user
      "#\\36 053610b-6eaf-be4b-09bd-b1c50dd250fb > div > div.flex.w-full.flex-1.flex-col.gap-4.overflow-y-auto.px-4.py-5 > div.flex.items-start.justify-between.gap-4 > div.flex.items-start.gap-2 > div",
      // Previous specific selector
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
    
    // Method 2: If selectors fail, try to find title by looking at the URL
    if (!title) {
      const match = window.location.pathname.match(/\/problems\/([^/]+)/);
      if (match && match[1]) {
        // Convert slug to title (e.g., "two-sum" -> "Two Sum")
        title = match[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        console.log('Found title from URL:', title);
      }
    }
    
    // Method 3: Look for elements that might contain the title based on text patterns
    if (!title) {
      // Find all heading elements and div elements with text content
      const potentialTitleElements = [
        ...document.querySelectorAll('h1, h2, h3, h4, h5, div')
      ].filter(el => {
        const text = el.textContent.trim();
        // Title is likely to be short and not contain certain patterns
        return text.length > 0 && 
               text.length < 100 && 
               !text.includes('\n') &&
               !text.includes('class Solution') &&
               !text.includes('function ') &&
               !text.includes('Example') &&
               !text.includes('Input:') &&
               !text.includes('Output:');
      });
      
      // Sort by length (shorter is more likely to be a title)
      potentialTitleElements.sort((a, b) => 
        a.textContent.trim().length - b.textContent.trim().length
      );
      
      // Take the first (shortest) element as the title
      if (potentialTitleElements.length > 0) {
        title = potentialTitleElements[0].textContent.trim();
        console.log('Found title using text pattern analysis');
      }
    }

    // Get problem description - try multiple possible selectors
    let description = '';
    const descriptionSelectors = [
      // Specific selector provided by user
      "#cd99a06b-5cf2-c87f-530b-46c62a50f150 > div > div.flex.w-full.flex-1.flex-col.gap-4.overflow-y-auto.px-4.py-5 > div:nth-child(3)",
      // Generic selectors as fallbacks
      '[data-cy="question-content"]',
      'div[class*="content_"]',
      'div[class*="description_"]'
    ];

    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('Found potential description element using selector:', selector);
        
        // Get the full text first
        const fullText = element.textContent.trim();
        console.log('Description element text length:', fullText.length);
        
        // Find where the examples section starts
        const exampleIndex = fullText.indexOf('Example 1:');
        if (exampleIndex === -1) {
          // If "Example 1:" not found, try just "Example"
          const altExampleIndex = fullText.indexOf('Example');
          if (altExampleIndex > 0 && altExampleIndex < fullText.length / 2) {
            // Only use this if "Example" appears in the first half of the text
            // This avoids cutting off too early if "Example" appears in the problem statement
            description = fullText.substring(0, altExampleIndex).trim();
            console.log('Using text before "Example" at position:', altExampleIndex);
          } else {
            // If no clear example section, use the full text but limit to 2000 chars
            description = fullText;
            console.log('Using full text, no clear example section found');
          }
        } else {
          // Take everything before "Example 1:"
          description = fullText.substring(0, exampleIndex).trim();
          console.log('Using text before "Example 1:" at position:', exampleIndex);
        }
        
        // Clean up the description
        description = description
          .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
          .trim();
          
        if (description) {
          console.log('Found description using selector:', selector);
          break;
        }
      }
    }
    
    // If description is still empty, use a more targeted approach
    if (!description) {
      // Look for paragraphs that don't contain code or examples
      const paragraphs = [...document.querySelectorAll('p')]
        .filter(p => {
          const text = p.textContent.trim();
          return text.length > 20 && 
                 !text.includes('class Solution') &&
                 !text.includes('function ') &&
                 !text.includes('Input:') &&
                 !text.includes('Output:');
        });
      
      if (paragraphs.length > 0) {
        // Combine all paragraphs (not just the first 3)
        description = paragraphs
          .map(p => p.textContent.trim())
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        console.log('Found description using paragraphs');
      }
    }
    
    // If description is too long, truncate it but with a higher limit
    if (description.length > 2000) {
      description = description.substring(0, 2000) + '...';
    }

    // Get code (if any is written)
    let code = '';
    const codeSelectors = [
      // Specific selector provided by user
      "#editor > div.flex.flex-1.flex-col.overflow-hidden.pb-2 > div.flex-1.overflow-hidden > div",
      // Generic selectors as fallbacks
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
          // Try to get code from Monaco editor
          const codeLines = element.querySelectorAll('.view-line');
          if (codeLines && codeLines.length > 0) {
            code = Array.from(codeLines)
              .map(line => line.textContent)
              .join('\n')
              .trim();
          } else {
            // If no view-lines found, try to get the text content directly
            code = element.textContent.trim();
          }
        }
        
        if (code) {
          console.log('Found code using selector:', selector);
          
          // Basic cleanup for code
          // Remove extra whitespace but preserve newlines
          code = code.split('\n')
            .map(line => line.trim())
            .join('\n')
            .replace(/\n{3,}/g, '\n\n'); // Replace 3+ consecutive newlines with 2
            
          break;
        }
      }
    }

    // Truncate long strings for logging
    const truncate = (str, len = 100) => 
      str.length > len ? str.substring(0, len) + '...' : str;
      
    console.log('Extracted details:', { 
      title, 
      description: truncate(description, 150), 
      code: truncate(code)
    });

    return {
      success: true,
      title,
      description,
      code
    };
  } catch (error) {
    console.error('Error extracting problem details:', error);
    return {
      success: false,
      title: '',
      description: '',
      code: '',
      error: error.message
    };
  }
} 