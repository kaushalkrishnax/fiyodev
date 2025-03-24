import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SideNav from "./items/SideNav";
import BottomNav from "./items/BottomNav";

const NavStack = () => {
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 768px)").matches
  );

  const noBottomNavRoutes = [ 
    "/direct/inbox",
    "/direct/t/:id",
    "/notifications",
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {isMobile ? (
        !noBottomNavRoutes.includes(useLocation().pathname) && <BottomNav />
      ) : (
        <SideNav />
      )}
    </>
  );
};

export default NavStack;
