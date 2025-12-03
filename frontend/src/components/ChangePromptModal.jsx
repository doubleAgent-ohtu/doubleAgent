import axios from 'axios';
import { useState, useEffect } from 'react';

const ChangePromptModal = (modalRef, savedPrompts, setSavedPrompts, onSetPrompt, chatbot, onClose) => {

    return (
    <dialog ref={modalRef} className="modal">

      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          Close
        </button>
      </form>
    </dialog>
  );
};

export default ChangePromptModal;