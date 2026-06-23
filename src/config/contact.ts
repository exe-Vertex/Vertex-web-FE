export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'nguyenvankhoa.contact@gmail.com';
export const CONTACT_NAME = import.meta.env.VITE_CONTACT_NAME || 'Nguyen Van Khoa';

const enterpriseSubject = 'Vertex Institution / Enterprise inquiry';
const enterpriseBody = `Hi ${CONTACT_NAME},\n\nI would like to learn more about Vertex Institution/Enterprise plans.\n\nOrganization:\nExpected classes/projects:\nExpected users:\nNotes:\n`;

export const CONTACT_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}&su=${encodeURIComponent(enterpriseSubject)}&body=${encodeURIComponent(enterpriseBody)}`;
