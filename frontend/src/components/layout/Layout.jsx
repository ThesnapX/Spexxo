import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import PopupManager from "./PopupManager";
import ScrollToTop from "../common/ScrollToTop";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navigation />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <PopupManager />
    </div>
  );
};

export default Layout;
