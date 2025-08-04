const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER || 'dummy@example.com', // your email
    pass: process.env.EMAIL_PASSWORD || 'dummy_password' // your app password
  }
});

// Email templates
const emailTemplates = {
  taskAssigned: (taskTitle, providerName) => ({
    subject: `Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">TaskBazaar Notification</h2>
        <p>Hello!</p>
        <p>Great news! Your task <strong>"${taskTitle}"</strong> has been assigned to <strong>${providerName}</strong>.</p>
        <p>The provider will contact you soon to discuss the details and schedule.</p>
        <p>Thank you for using TaskBazaar!</p>
        <br>
      </div>
    `
  }),
  
  taskCompleted: (taskTitle) => ({
    subject: `Task Completed: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">TaskBazaar Notification</h2>
        <p>Hello!</p>
        <p>Your task <strong>"${taskTitle}"</strong> has been marked as completed!</p>
        <p>Please review the work and provide feedback if needed.</p>
        <p>Thank you for using TaskBazaar!</p>
        <br>
        <p style="color: #666; font-size: 12px;">This is an automated notification from TaskBazaar.</p>
      </div>
    `
  }),
  
  taskCancelled: (taskTitle) => ({
    subject: `Task Cancelled: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">TaskBazaar Notification</h2>
        <p>Hello!</p>
        <p>Your task <strong>"${taskTitle}"</strong> has been cancelled.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you for using TaskBazaar!</p>
        <br>
        <p style="color: #666; font-size: 12px;">This is an automated notification from TaskBazaar.</p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  try {
    const emailContent = emailTemplates[template](...Object.values(data));
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// Specific notification functions
const sendTaskAssignedNotification = async (userEmail, taskTitle, providerName) => {
  return await sendEmail(userEmail, 'taskAssigned', [taskTitle, providerName]);
};

const sendTaskCompletedNotification = async (userEmail, taskTitle) => {
  return await sendEmail(userEmail, 'taskCompleted', [taskTitle]);
};

const sendTaskCancelledNotification = async (userEmail, taskTitle) => {
  return await sendEmail(userEmail, 'taskCancelled', [taskTitle]);
};

module.exports = {
  sendEmail,
  sendTaskAssignedNotification,
  sendTaskCompletedNotification,
  sendTaskCancelledNotification
}; 