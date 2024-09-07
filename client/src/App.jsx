import React from "react";
import { Route, Routes } from "react-router-dom";

import { Navbar } from "./components";
import { CampaignDetails, CreateCampaign, Home, Profile } from "./pages";
import FundedCampaign from "./pages/FundedCampaigns";

const App = () => {
  return (
    <div className="relative sm:p-8 p-4 bg-[#f3f4f6] min-h-screen flex flex-row">
      <div className="flex-1 max-sm:w-full mx-auto sm:pr-5">
        <Navbar />

        <div className="px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/funded" element={<FundedCampaign />} />
            <Route path="/create-campaign" element={<CreateCampaign />} />
            <Route path="/campaign-details/:id" element={<CampaignDetails />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
