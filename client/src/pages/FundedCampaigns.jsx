import React, { useState, useEffect } from "react";

import { DisplayCampaigns } from "../components";
import { useStateContext } from "../context";
import { search } from "../assets";

const FundedCampaign = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [searchedCampaigns, setSearchedCampaigns] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const { address, contract, getCampaigns } = useStateContext();

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const data = await getCampaigns();

      setCampaigns(
        data.filter((campaign) => campaign.donators.includes(address))
      );
    } catch (error) {
      console.log(error);
      alert("Error fetching campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contract) fetchCampaigns();
  }, [address, contract]);

  const onSearchCampaign = (keyword) => {
    if (keyword == "") return;

    setSearchedCampaigns(
      campaigns.filter(
        (campaign) =>
          campaign.title.toLowerCase().includes(keyword.toLowerCase()) ||
          campaign.description.toLowerCase().includes(keyword.toLowerCase()) ||
          campaign.category.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  };

  useEffect(() => {
    onSearchCampaign(searchKeyword);
  }, [searchKeyword]);

  return (
    <div className="">
      <div className="lg:flex-1 flex flex-row max-w-[458px] py-2 pl-4 pr-2 h-[52px] mb-8 bg-slate-200 rounded-[2rem]">
        <input
          type="text"
          placeholder="Search for campaigns"
          className="flex w-full font-epilogue font-normal text-[14px] placeholder:text-[#4b5264] bg-transparent outline-none"
          onChange={(e) => setSearchKeyword(e.target.value)}
        />

        <div
          className="w-[72px] h-full rounded-[20px] bg-[#4acd8d] flex justify-center items-center cursor-pointer"
          onClick={() => onSearchCampaign(searchKeyword)}
        >
          <img
            src={search}
            alt="search"
            className="w-[15px] h-[15px] object-contain"
          />
        </div>
      </div>

      <DisplayCampaigns
        title="Campaigns you have funded"
        isLoading={isLoading}
        campaigns={searchKeyword != "" ? searchedCampaigns : campaigns}
      />
    </div>
  );
};

export default FundedCampaign;
