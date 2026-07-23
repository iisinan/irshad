const fs = require('fs');

const css = `

/* ===================================================
   OVERLAY SIDEBAR LAYOUT (FINTECH UX)
   =================================================== */
.dashboard-sidebar-container {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  height: 100vh !important;
  z-index: 1000 !important;
  transform: translateX(0);
}

.dashboard-main-content {
  flex: 1;
  padding-left: 72px; /* Dock space */
  overflow-x: hidden;
  min-width: 0;
  transition: padding-left 0.3s cubic-bezier(0.16,1,0.3,1);
}

@media (max-width: 820px) {
  .dashboard-main-content {
    padding-left: 0 !important;
  }
  .dashboard-sidebar-container {
    transform: translateX(-100%) !important;
    width: 260px !important;
  }
  .dashboard-sidebar-container.open {
    transform: translateX(0) !important;
    box-shadow: 0 0 50px rgba(0,0,0,0.5); /* Nice drawer shadow */
  }
}
`;

fs.appendFileSync('src/index.css', css);
console.log('Appended overlay sidebar CSS!');
