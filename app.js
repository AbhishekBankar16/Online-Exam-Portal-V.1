// Open IndexedDB and set up the database
let db;

window.onload = function() {
  let request = indexedDB.open('examPortal', 2); // Incremented the version number

  request.onupgradeneeded = function(event) {
    db = event.target.result;

    // Create object stores if they don't exist
    db.createObjectStore('users', { keyPath: 'username' });
    db.createObjectStore('exams', { keyPath: 'id', autoIncrement: true });
    db.createObjectStore('results', { keyPath: 'id', autoIncrement: true });
    db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
  };

  request.onsuccess = function(event) {
    db = event.target.result;
    loadExams(); // Call the loadExams function after the database has been initialized
  };

  request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
  };
};

// Sign-Up function
function signUp() {
  let role = document.getElementById('signupRole').value;
  let username = document.getElementById('signupUsername').value;
  let password = document.getElementById('signupPassword').value;

  if (username && password) {
    let transaction = db.transaction('users', 'readwrite');
    let usersStore = transaction.objectStore('users');

    let newUser = {
      username: username,
      password: password,
      role: role
    };

    let request = usersStore.add(newUser);

    request.onsuccess = function() {
      alert('Sign-Up Successful! Please log in.');
      window.location.href = 'index.html';
    };

    request.onerror = function() {
      alert('Sign-Up Failed. Username might already exist.');
    };
  } else {
    alert('Please fill in all fields.');
  }
}

// Login function
function login() {
  let role = document.getElementById('role').value;
  let username = document.getElementById('username').value;
  let password = document.getElementById('password').value;

  let transaction = db.transaction('users', 'readonly');
  let usersStore = transaction.objectStore('users');

  let request = usersStore.get(username);

  request.onsuccess = function(event) {
    let user = event.target.result;

    if (user && user.password === password && user.role === role) {
      localStorage.setItem('loggedInUser', username);
      window.location.href = role === 'student' ? 'student.html' : 'teacher.html';
    } else {
      alert('Invalid credentials or role. Please try again.');
    }
  };

  request.onerror = function() {
    alert('Login failed. Please try again.');
  };
}

// Add Question for the exam
function addQuestion() {
  const container = document.getElementById('questionsContainer');
  const questionIndex = container.childElementCount;

  const questionHTML = `
    <div>
      <input type="text" id="question${questionIndex}" placeholder="Question ${questionIndex + 1}" required>
      <input type="text" id="q${questionIndex}option0" placeholder="Option 1" required>
      <input type="text" id="q${questionIndex}option1" placeholder="Option 2" required>
      <input type="text" id="q${questionIndex}option2" placeholder="Option 3" required>
      <input type="text" id="q${questionIndex}option3" placeholder="Option 4" required>
      <label>Correct Answer:</label>
      <select id="q${questionIndex}correct">
        <option value="0">Option 1</option>
        <option value="1">Option 2</option>
        <option value="2">Option 3</option>
        <option value="3">Option 4</option>
      </select>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', questionHTML);
}

// Create Exam function
function createExam() {
  let title = document.getElementById('examTitle').value;
  let questions = [];

  const questionElements = document.getElementById('questionsContainer').children;

  for (let i = 0; i < questionElements.length; i++) {
    const question = document.getElementById(`question${i}`).value;
    const options = [
      document.getElementById(`q${i}option0`).value,
      document.getElementById(`q${i}option1`).value,
      document.getElementById(`q${i}option2`).value,
      document.getElementById(`q${i}option3`).value
    ];
    const correctAnswer = document.getElementById(`q${i}correct`).value;

    questions.push({ question, options, correctAnswer });
  }

  let exam = { title, questions };

  let transaction = db.transaction('exams', 'readwrite');
  let examsStore = transaction.objectStore('exams');

  let request = examsStore.add(exam);

  request.onsuccess = function() {
    alert('Exam created successfully!');
    window.location.reload();
  };

  request.onerror = function() {
    alert('Failed to create exam.');
  };
}

// Add Notification function
function addNotification() {
  let text = document.getElementById('notificationText').value;

  if (text) {
    let transaction = db.transaction('notifications', 'readwrite');
    let notificationsStore = transaction.objectStore('notifications');

    let notification = { text, date: new Date().toISOString() };

    let request = notificationsStore.add(notification);

    request.onsuccess = function() {
      alert('Notification sent successfully!');
      loadNotifications();
    };
  }
}

// Load Exams function
function loadExams() {
  console.log('Loading exams...');

  const examList = document.getElementById('studentResultsList');

  if (examList) {
    examList.innerHTML = ''; // Clear previous exams

    const request = indexedDB.open('examPortal', 2);

    request.onsuccess = function(event) {
      console.log('Database opened successfully');

      const db = event.target.result;
      const transaction = db.transaction(['exams'], 'readonly');
      const objectStore = transaction.objectStore('exams');

      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = function(event) {
        console.log('Exams retrieved successfully');

        const exams = event.target.result;

        if (exams.length === 0) {
          examList.textContent = 'No exams available.';
        } else {
          exams.forEach(exam => {
            const examItem = document.createElement('div');
            examItem.textContent = `Exam Title: ${exam.title}, Date: ${exam.date}`; // Adjust properties based on your exam structure
            examItem.innerHTML += `<button onclick="takeExam(${exam.id})">Take Exam</button>`;
            examList.appendChild(examItem);
          });
        }
      };

      getAllRequest.onerror = function() {
        console.error('Error retrieving exams:', getAllRequest.error);
      };
    };

    request.onerror = function() {
      console.error('Database error:', request.error);
    };
  } else {
    console.error('Element not found: studentResultsList');
  }
}

// Edit Exam function
function editExam(examId) {
  let transaction = db.transaction('exams', 'readonly');
  let examsStore = transaction.objectStore ('exams');

  let examRequest = examsStore.get(examId);

  examRequest.onsuccess = function() {
    let exam = examRequest.result;
    if (exam) {
      // Populate form fields with the exam data to be edited
      document.getElementById("examTitle").value = exam.title;
      // Do this for other fields as well...
    }
  };
}

function saveEditedExam(examId) {
  let transaction = db.transaction('exams', 'readwrite');
  let examsStore = transaction.objectStore('exams');

  // Assuming you've collected the updated exam data from a form
  let updatedExam = {
    id: examId,
    title: document.getElementById("examTitle").value,
    // Add other fields as necessary
  };

  let updateRequest = examsStore.put(updatedExam); // Update the existing exam
  updateRequest.onsuccess = function() {
    console.log("Exam updated successfully!");
  };
}

// Delete Exam function
function deleteExam(id) {
  let transaction = db.transaction('exams', 'readwrite');
  let examsStore = transaction.objectStore('exams');

  let request = examsStore.delete(id);

  request.onsuccess = function() {
    alert('Exam deleted successfully!');
    loadExams(); // Reload the exams list
  };
}

function loadExams() {
  console.log('Loading exams...');

  const examList = document.getElementById('studentResultsList');
  examList.innerHTML = ''; // Clear previous exams

  const request = indexedDB.open('examPortal', 2); // Use the same version number as in the window.onload event handler

  request.onsuccess = function(event) {
    console.log('Database opened successfully');

    const db = event.target.result;
    const transaction = db.transaction(['exams'], 'readonly'); // Specify the mode (readonly) and the key path (exams)
    const objectStore = transaction.objectStore('exams', { keyPath: 'id', autoIncrement: true }); // Specify the key path and auto-incrementing key

    const getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = function(event) {
      console.log('Exams retrieved successfully');

      const exams = event.target.result;

      if (exams.length === 0) {
        examList.textContent = 'No exams available.';
      } else {
        exams.forEach(exam => {
          const examItem = document.createElement('div');
          examItem.textContent = `Exam Title: ${exam.title}, Date: ${exam.date}`; // Adjust properties based on your exam structure
          examItem.innerHTML += `<button onclick="takeExam(${exam.id})">Take Exam</button>`;
          examList.appendChild(examItem);
        });
      }
    };

    getAllRequest.onerror = function() {
      console.error('Error retrieving exams:', getAllRequest.error);
    };
  };

  request.onerror = function() {
    console.error('Database error:', request.error);
  };
}

// Display Exam for Student
function displayExam(exam) {
  const examContent = document.getElementById('examContent');
  if (examContent) {
    examContent.innerHTML = ''; // Clear previous exam content

    exam.questions.forEach((q, index) => {
      examContent.innerHTML += `
        <div>
          <p>${index + 1}. ${q.questionText}</p>
          <label><input type="radio" name="answer_${index}" value="A"> ${q.options[0]}</label>
          <label><input type="radio" name="answer_${index}" value="B"> ${q.options[1]}</label>
          <label><input type="radio" name="answer_${index}" value="C"> ${q.options[2]}</label>
          <label><input type="radio" name="answer_${index}" value="D"> ${q.options[3]}</label>
        </div>
      `;
    });

    document.getElementById('examSection').style.display = 'block';
  }
}

// Take Exam function
function takeExam(id) {
  let transaction = db.transaction('exams', 'readonly');
  let examsStore = transaction.objectStore('exams');

  let request = examsStore.get(id);

  request.onsuccess = function(event) {
    let exam = event.target.result;
    let container = document.querySelector('.student-container');
    let examHTML = `<h2>${exam.title}</h2>`;

    exam.questions.forEach((question, index) => {
      examHTML += `
        <div>
          <p>${question.question}</p>
          ${question.options.map((option, i) => `
            <label>
              <input type="radio" name="q${index}" value="${i}" required> ${option}
            </label><br>
          `).join('')}
        </div>
      `;
    });

    examHTML += `<button onclick="submitExam(${exam.id})">Submit Exam</button>`;
    container.innerHTML = examHTML;
  };
}

// Submit Exam function
function submitExam(id) {
  let transaction = db.transaction('exams', 'readonly');
  let examsStore = transaction.objectStore('exams');

  let request = examsStore.get(id);

  request.onsuccess = function(event) {
    let exam = event.target.result;
    let correctAnswers = 0;

    exam.questions.forEach((question, index) => {
      let selectedOption = document.querySelector(`input[name="q${index}"]:checked`);
      if (selectedOption && parseInt(selectedOption.value) === parseInt(question.correctAnswer)) {
        correctAnswers++;
      }
    });

    let totalQuestions = exam.questions.length;
    let score = (correctAnswers / totalQuestions) * 100;

    alert(`You scored: ${score}% (${correctAnswers} out of ${totalQuestions} correct)`);

    saveResult(id, correctAnswers, totalQuestions);
  };
}
// Save Result to IndexedDB
function saveResult(examId, correctAnswers, totalQuestions) {
  let username = localStorage.getItem('loggedInUser');
  let transaction = db.transaction('results', 'readwrite');
  let resultsStore = transaction.objectStore('results');

  let result = {
    username: username,
    examId: examId,
    correctAnswers: correctAnswers,
    totalQuestions: totalQuestions,
    submissionTime: new Date().toISOString()
  };

  let request = resultsStore.add(result);

  request.onsuccess = function() {
    alert('Exam results saved successfully.');
    displayResult(examId, correctAnswers, totalQuestions);
  };
}

// Display Result function
function displayResult(examId, correctAnswers, totalQuestions) {
  let container = document.querySelector('.student-container');
  let resultHTML = `<h2>Exam Result</h2>`;

  resultHTML += `
    <p>Exam ID: ${examId}</p>
    <p>Correct Answers: ${correctAnswers}/${totalQuestions}</p>
    <p>Score: ${(correctAnswers / totalQuestions) * 100}%</p>
  `;

  container.innerHTML = resultHTML;
}

// Function to save notifications
function saveNotification(notificationData) {
  var request = indexedDB.open("ExamPortal", 1);
  request.onsuccess = function(event) {
    var db = event.target.result;
    var transaction = db.transaction(["notifications"], "readwrite");
    var store = transaction.objectStore("notifications");
    var request = store.add(notificationData);
    request.onsuccess = function() {
      console.log("Notification saved successfully!");
    };
    request.onerror = function() {
      console.log("Error saving notification.");
    };
  };
}

function loadNotifications() {
  let request = indexedDB.open("ExamPortal", 1);
  request.onsuccess = function(event) {
    let db = event.target.result;
    let transaction = db.transaction(["notifications"], "readonly");
    let store = transaction.objectStore("notifications");
    let request = store.getAll();

    request.onsuccess = function() {
      let notifications = request.result;
      let notificationList = document.getElementById("studentNotificationList");

      // Check if element exists
      if (notificationList) {
        notificationList.innerHTML = ""; // Clear previous content

        notifications.forEach(function(notification) {
          let listItem = document.createElement("div");
          listItem.innerText = notification.text;
          notificationList.appendChild(listItem);
        });
      } else {
        console.error('Element not found: studentNotificationList');
      }
    };
  };
}

// Edit Notification
function editNotification(id) {
  let transaction = db.transaction('notifications', 'readonly');
  let notificationsStore = transaction.objectStore('notifications');

  let request = notificationsStore.get(id);

  request.onsuccess = function(event) {
    let notification = event.target.result;
    if (notification) {
      // Populate the notification field with current notification data for editing
      document.getElementById('notificationText').value = notification.text;

      // Update the notification after editing
      document.getElementById('saveNotificationButton').onclick = function() {
        notification.text = document.getElementById('notificationText').value;

        let updateTransaction = db.transaction('notifications', 'readwrite');
        let updateStore = updateTransaction.objectStore('notifications');
        updateStore.put(notification).onsuccess = function() {
          alert('Notification updated successfully!');
          loadNotifications();
        };
      };
    }
  };
}

// Delete Notification
function deleteNotification(id) {
  let transaction = db.transaction('notifications', 'readwrite');
  let notificationsStore = transaction.objectStore('notifications');

  let request = notificationsStore.delete(id);

  request.onsuccess = function() {
    alert('Notification deleted successfully!');
    loadNotifications(); // Reload the notifications list
  };
}

// Load Notifications
function loadNotifications() {
  let transaction = db.transaction('notifications', 'readonly');
  let notificationsStore = transaction.objectStore('notifications');

  let request = notificationsStore.getAll();

  request.onsuccess = function(event) {
    let notifications = event.target.result;
    let container = document.querySelector('#studentNotificationList');
    let notificationList = '';

    notifications.forEach(notification => {
      notificationList += `
        <p>${notification.text}</p>
        <p> Sent by: ${notification.teacherUsername} on ${notification.sentAt}</p>
      `;
    });

    container.innerHTML = notificationList;
  };
}

// Load Results
function loadResults() {
  let transaction = db.transaction('results', 'readonly');
  let resultsStore = transaction.objectStore('results');

  let request = resultsStore.getAll();

  request.onsuccess = function(event) {
    let results = event.target.result;
    let container = document.querySelector('.teacher-container');
    let resultList = '<h2>Exam Results</h2>';

    results.forEach(result => {
      let submissionTime = new Date(result.submissionTime);
      let formattedTime = submissionTime.toLocaleTimeString();
      let formattedDate = submissionTime.toLocaleDateString();

      let resultField = `${result.correctAnswers} / ${result.totalQuestions} (Score: ${(result.correctAnswers / result.totalQuestions) * 100}%)`;

      resultList += `
        <div>
          <p>Student: ${result.username}</p>
          <p>Exam ID: ${result.examId}</p>
          <p>Result: ${resultField}</p>
          <p>Submitted on: ${formattedDate} at ${formattedTime}</p>
        </div>
      `;
    });

    container.innerHTML = resultList;
  };
}

// Navigate Home
function goHome() {
  window.location.href = 'index.html';
}