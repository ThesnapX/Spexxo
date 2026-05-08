import Contact from "../models/Contact.js";
import sendEmail from "../utils/sendEmail.js";

export const submitContact = async (req, res) => {
  try {
    const contact = await Contact.create(req.body);

    // Send notification to admin
    const adminEmail = `
      <h1>New Contact Form Submission</h1>
      <p><strong>Name:</strong> ${contact.name}</p>
      <p><strong>Email:</strong> ${contact.email}</p>
      <p><strong>Phone:</strong> ${contact.phone || "N/A"}</p>
      <p><strong>Subject:</strong> ${contact.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${contact.message}</p>
    `;

    try {
      await sendEmail({
        email: "satyapatanakar5@gmail.com",
        subject: `New Contact: ${contact.subject}`,
        html: adminEmail,
      });
    } catch (emailError) {
      console.log("Admin notification email failed");
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort("-createdAt");
    res.status(200).json({ success: true, contacts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
