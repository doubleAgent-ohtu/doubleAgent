const HamburgerMenu = () => {
  return (
    <div className="lg:hidden mb-4">
      <label htmlFor="my-drawer-4" className="btn btn-ghost btn-circle drawer-button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="inline-block w-6 h-6 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </label>
    </div>
  );
};

export default HamburgerMenu;
