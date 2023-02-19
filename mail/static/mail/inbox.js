document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('.reply-btn').onclick = reply_email;
  document.querySelector('.archive-btn').onclick = archive_email;
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
};

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Get the emails for the selected mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const emailDiv = document.createElement('div');
      //emailDiv.id = email.id
      emailDiv.className = `read${email.read} d-flex justify-content-between emails`
      if (mailbox == 'sent') {
        emailDiv.innerHTML = `<b>${email.recipients}</b> ${email.subject} <span>${email.timestamp}</span>`
      } else {
        emailDiv.innerHTML = `<b>${email.sender}</b> ${email.subject} <span>${email.timestamp}</span>`
      }
      emailDiv.addEventListener('click', () => read_mail(mailbox, email.id))
      document.querySelector('#emails-view').append(emailDiv)
    });
  });
};

function read_mail(mailbox, email_id) {
  // Show the 'read' view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'block';
  document.querySelector('#read-email').innerHTML = '';
  document.querySelector('.archive-btn').style.display = 'block';
  //Setting up the reply and archive buttons
  document.querySelector(".reply-btn").id = email_id;
  document.querySelector(".archive-btn").id = email_id;

  //Mark mail as read
  fetch('emails/' + email_id, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })

  // Fetch email
  fetch('/emails/' + email_id)
  .then(response => response.json())
  .then(email => {
    const mailDetails = document.createElement('div')
    mailDetails.innerHTML = `<p><b>From:</b> ${email.sender}<br><b>To:</b> ${email.recipients}<br><b>Timestamp:</b> ${email.timestamp}</p><hr>`
    document.querySelector('#read-email').append(mailDetails)
    const mailBody = document.createElement('div')
    mailBody.innerHTML = `<p>${email.body}</p>`
    document.querySelector('#read-email').append(mailBody)
  });

  // Display the button correctly
  if (mailbox == 'inbox') {
    document.querySelector('.archive-btn').innerHTML = 'Archive';
  } else if (mailbox == 'archive') {
    document.querySelector('.archive-btn').innerHTML = 'Unarchive';
  } else {
    document.querySelector('.archive-btn').style.display = 'none'
  };
};

// Send the mail on form submission
function send_email() {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    alert(Object.values(result)[0])
  })
  setTimeout(load_mailbox, 500, 'sent')
  return false;
};

//Reply to an email
function reply_email() {

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-view').style.display = 'none';

  // Fetch email to pre-fill composition form
  fetch('/emails/' + this.id)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = `RE: ${email.subject}`;
    document.querySelector('#compose-body').value = `On ${email.timestamp},  ${email.sender} wrote:    "${email.body}"`;
  });
};

// Archive email
async function archive_email() {
  if (this.innerHTML == 'Archive') {
    await fetch('emails/' + this.id, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    })
  } else {
    await fetch('emails/' + this.id, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    })
  }
  load_mailbox('inbox')
};