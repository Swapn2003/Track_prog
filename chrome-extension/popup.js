const API_URL = 'https://track-prog-backend.onrender.com';

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
    topicSelect.innerHTML = '<option value="">Select Topic</option>';
    topics.forEach(topic => {
      const option = document.createElement('option');
      option.value = topic;
      option.textContent = topic;
      topicSelect.appendChild(option);
    });
  } catch (error) {
    showMessage('Failed to load topics', true);
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
  const problemData = {
    topic: document.getElementById('topic').value,
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    problemLink: document.getElementById('problemLink').value,
    approach: document.getElementById('approach').value,
    code: document.getElementById('code').value,
    timeComplexity: document.getElementById('timeComplexity').value,
    spaceComplexity: document.getElementById('spaceComplexity').value,
    isBasic: document.getElementById('isBasic').checked
  };

  if (!problemData.topic) {
    showMessage('Please select a topic', true);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(problemData)
    });

    const data = await response.json();
    if (response.ok) {
      showMessage('Problem saved successfully!', false);
      setTimeout(() => window.close(), 1500);
    } else {
      showMessage(data.message, true);
    }
  } catch (error) {
    showMessage('Failed to save problem', true);
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