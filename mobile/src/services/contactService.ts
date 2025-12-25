import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ContactSubmission } from '@/types/contact';

export const contactService = {
  submitContactForm: async (data: ContactSubmission): Promise<void> => {
    const contactsRef = collection(db, 'contacts');
    await addDoc(contactsRef, {
      ...data,
      timestamp: new Date(),
    });
  },
};

