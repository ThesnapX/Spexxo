import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "./Navigation";
import Footer from "./Footer";
import PopupManager from "./PopupManager";
import ScrollToTop from "../common/ScrollToTop";
import RoutePrefetcher from "../common/RoutePrefetcher";
import { initAnalytics } from "../../utils/analytics";

const Layout = () => {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navigation />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <PopupManager />
      <RoutePrefetcher />
    </div>
  );
};

export default Layout;
