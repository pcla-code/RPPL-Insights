/*
document.querySelector('.hqim-box.top-box').addEventListener('click', () => {
  document.getElementById('ssc-modal').style.display = 'flex';
});

*/

/*
document.querySelectorAll('.hqim-box.top-box, .hqim-box.half-box').forEach(box => {
  box.addEventListener('click', (e) => {
    const boxName = e.currentTarget.dataset.box;
    console.log("You clicked:", boxName);

    // Example: open modal with the same ID as data-box + "-modal"
    const modalId = `${boxName}-modal`;
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
    }
  });
});
*/


// Opening
document.querySelectorAll('.hqim-box.top-box, .hqim-box.half-box').forEach(box => {
  box.addEventListener('click', (e) => {
    const boxName = e.currentTarget.dataset.box;
    console.log("You clicked:", boxName);

    // jn.112025 — notify the School/System page about the new construct
    if (window.setCurrentConstructAndRefresh) {
      // boxName is e.g. "professional-learning", "school-system", etc.
      window.setCurrentConstructAndRefresh(boxName);
    }

    const modalId = e.currentTarget.dataset.modal || boxName + '-modal';
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
    }
  });
});


// Closing
document.querySelectorAll('.close-button').forEach(button => {
  button.addEventListener('click', (e) => {
		
    const modalId = e.currentTarget.dataset.close;
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  });
});

// Closing by clicking outside modal content
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    // Only close if click is on the overlay, not inside .modal-content
    if (e.target === overlay) {
      overlay.style.display = 'none';
    }
  });
});
