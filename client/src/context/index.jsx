import React, { useContext, createContext } from "react";

import {
  useAddress,
  useContract,
  useMetamask,
  useContractWrite,
  useDisconnect,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract(
    "0x818215aEeF76D52C6D6F1DAf9eF81a846267d57E"
  );
  const { mutateAsync: createCampaign } = useContractWrite(
    contract,
    "createCampaign"
  );

  const address = useAddress();
  const connect = useMetamask();
  const disconnect = useDisconnect();

  const publishCampaign = async (form) => {
    try {
      const data = await createCampaign({
        args: [
          address, // owner
          form.title, // title
          form.description, // description
          form.target,
          new Date(form.deadline).getTime(), // deadline,\
          form.category ?? "",
          form.image,
          form.tokenAmount ?? 10000,
        ],
      });

      console.log("contract call success", data);
    } catch (error) {
      console.log("contract call failure", error);
    }
  };

  const getCampaigns = async () => {
    const campaigns = await contract.call("getCampaigns");

    const parsedCampaings = campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      category: campaign.category,
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(
        campaign.amountCollected.toString()
      ),
      hasWithdrawed: campaign.hasWithdrawed,
      hasEnded: campaign.hasEnded,
      isWithdrawable: campaign.isWithdrawable,
      isSuccessful: campaign.isSuccessful,
      tokensSold: ethers.utils.formatEther(campaign.tokensSold.toString()),
      tokensForSale: ethers.utils.formatEther(
        campaign.tokensForSale.toString()
      ),
      tokenPrice: ethers.utils.formatEther(campaign.tokenPrice.toString()),
      image: campaign.image,
      donators: campaign.contributors,
      pId: i,
    }));

    return parsedCampaings;
  };

  const getCampaignById = async (pId) => {
    const campaign = await contract.call("getCampaignById", [pId]);

    return {
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      category: campaign.category,
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(
        campaign.amountCollected.toString()
      ),
      hasWithdrawed: campaign.hasWithdrawed,
      hasEnded: campaign.hasEnded,
      isWithdrawable: campaign.isWithdrawable,
      isSuccessful: campaign.isSuccessful,
      tokensSold: ethers.utils.formatEther(campaign.tokensSold.toString()),
      tokensForSale: ethers.utils.formatEther(
        campaign.tokensForSale.toString()
      ),
      tokenPrice: ethers.utils.formatEther(campaign.tokenPrice.toString()),
      image: campaign.image,
      donators: campaign.contributors,
      pId,
    };
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter(
      (campaign) => campaign.owner === address
    );

    return filteredCampaigns;
  };

  const donate = async (pId, amount) => {
    const data = await contract.call("donateToCampaign", [pId], {
      value: ethers.utils.parseEther(amount),
    });

    return data;
  };

  const withdraw = async (pId, amount) => {
    const data = await contract.call("withdrawDonation", [pId], {
      value: ethers.utils.parseEther(amount),
    });

    return data;
  };

  const getDonations = async (pId) => {
    const donations = await contract.call("getDonators", [pId]);
    const numberOfDonations = donations[0].length;

    const parsedDonations = [];

    for (let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString()),
      });
    }

    return parsedDonations;
  };

  const endCampaign = async (pId) => {
    const data = await contract.call("endCampaign", [pId]);

    return data;
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        disconnect,
        endCampaign,
        createCampaign: publishCampaign,
        getCampaigns,
        getCampaignById,
        getUserCampaigns,
        donate,
        withdraw,
        getDonations,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
