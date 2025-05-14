// const API_URL = 'https://track-prog-backend.onrender.com';
const API_URL = 'https://track-prog-backend.vercel.app';

// Check authentication status on popup open
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    showLoginForm();
  } else {
    await loadTopics();
    await getCurrentProblem();
  }
});

// Login form handling
document.getElementById('loginBtn')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      hideLoginForm();
      await loadTopics();
      await getCurrentProblem();
    } else {
      showMessage(data.message, true);
    }
  } catch (error) {
    showMessage('Login failed. Please try again.', true);
  }
});

// Load topics from the API
async function loadTopics() {
  try {
    const response = await fetch(`${API_URL}/api/topics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const topics = await response.json();
    
    const topicSelect = document.getElementById('topic');
    topicSelect.innerHTML = ''; // Clear the loading option
    
    if (topics.length === 0) {
      const option = document.createElement('option');
      option.value = "";
      option.textContent = "No topics found - add one below";
      topicSelect.appendChild(option);
    } else {
      topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.textContent = topic;
        topicSelect.appendChild(option);
      });
    }
    
    // Add option to create a new topic
    const newTopicOption = document.createElement('option');
    newTopicOption.value = "new_topic";
    newTopicOption.textContent = "➕ Add New Topic";
    newTopicOption.style.fontWeight = "bold";
    topicSelect.appendChild(newTopicOption);
    
    // Add event listener for the new topic option
    topicSelect.addEventListener('change', handleTopicChange);
  } catch (error) {
    showMessage('Failed to load topics', true);
  }
}

// Handle topic change to show new topic input if needed
function handleTopicChange(e) {
  const topicSelect = document.getElementById('topic');
  const selectedOptions = Array.from(topicSelect.selectedOptions);
  
  // Check if "Add New Topic" is selected
  if (selectedOptions.some(option => option.value === 'new_topic')) {
    // Prompt for new topic name
    const newTopic = prompt('Enter new topic name:');
    if (newTopic && newTopic.trim()) {
      // Add the new topic to the dropdown
      const option = document.createElement('option');
      option.value = newTopic.trim();
      option.textContent = newTopic.trim();
      
      // Insert before the "Add New Topic" option
      topicSelect.insertBefore(option, topicSelect.lastChild);
      
      // Select the new topic and deselect "Add New Topic"
      option.selected = true;
      topicSelect.lastChild.selected = false;
    } else {
      // If canceled or empty, deselect "Add New Topic"
      topicSelect.lastChild.selected = false;
    }
  }
}

// Get current problem details from LeetCode page
async function getCurrentProblem() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('leetcode.com/problems/')) {
      showMessage('Please open a LeetCode problem page', true);
      return;
    }

    // Function to fill form with problem details
    const fillForm = (response) => {
      if (response && response.success) {
        document.getElementById('title').value = response.title;
        document.getElementById('description').value = response.description;
        document.getElementById('problemLink').value = tab.url;
        document.getElementById('code').value = response.code || '';
        
        if (!response.title && !response.description) {
          showMessage('Problem details not found. Please refresh the page.', true);
        }
      } else if (response && response.error) {
        showMessage(`Error: ${response.error}`, true);
      } else {
        showMessage('Failed to get problem details. Please refresh the page.', true);
      }
    };

    // Try to get problem details with retries
    let retries = 3;
    const tryGetDetails = () => {
      chrome.tabs.sendMessage(tab.id, { action: 'getProblemDetails' }, (response) => {
        if (chrome.runtime.lastError) {
          if (retries > 0) {
            retries--;
            setTimeout(tryGetDetails, 1000); // Retry after 1 second
          } else {
            showMessage('Failed to connect to the page. Please refresh.', true);
          }
          return;
        }
        fillForm(response);
      });
    };

    tryGetDetails();
  } catch (error) {
    showMessage('Failed to get problem details: ' + error.message, true);
  }
}

// Save problem to DSA tracker
document.getElementById('saveBtn')?.addEventListener('click', async () => {
  // Get selected topics
  const topicSelect = document.getElementById('topic');
  const selectedTopics = Array.from(topicSelect.selectedOptions).map(option => option.value);
  
  // Remove any "Add New Topic" option from the selection
  const validTopics = selectedTopics.filter(topic => topic !== 'new_topic' && topic !== '');
  
  if (validTopics.length === 0) {
    showMessage('Please select at least one topic', true);
    return;
  }
  
  const commonData = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    problemLink: document.getElementById('problemLink').value,
    approach: document.getElementById('approach').value,
    code: document.getElementById('code').value,
    timeComplexity: document.getElementById('timeComplexity').value,
    spaceComplexity: document.getElementById('spaceComplexity').value,
    isBasic: document.getElementById('isBasic').checked
  };

  try {
    showMessage('Saving problem...', false);
    
    // Create an array of promises for each topic
    const savePromises = validTopics.map(topic => {
      const problemData = {
        ...commonData,
        topic
      };
      
      return fetch(`${API_URL}/api/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(problemData)
      });
    });
    
    // Wait for all save operations to complete
    const responses = await Promise.all(savePromises);
    
    // Check if all responses were successful
    const allSuccessful = responses.every(response => response.ok);
    
    if (allSuccessful) {
      showMessage(`Problem saved successfully to ${validTopics.length} topic${validTopics.length > 1 ? 's' : ''}!`, false);
      setTimeout(() => window.close(), 1500);
    } else {
      // Get error messages from failed responses
      const errorMessages = await Promise.all(
        responses.filter(r => !r.ok).map(async r => {
          const data = await r.json();
          return data.message || 'Unknown error';
        })
      );
      
      showMessage(`Failed to save to some topics: ${errorMessages.join(', ')}`, true);
    }
  } catch (error) {
    showMessage('Failed to save problem: ' + error.message, true);
  }
});

// Utility functions
function showLoginForm() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('problemForm').style.display = 'none';
}

function hideLoginForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('problemForm').style.display = 'block';
}

function showMessage(message, isError) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = message;
  messageDiv.className = isError ? 'error' : 'success';
} 