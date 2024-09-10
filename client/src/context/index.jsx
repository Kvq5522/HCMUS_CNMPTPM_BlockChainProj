import React, { useContext, createContext } from "react";

import {
  useAddress,
  useContract,
  useMetamask,
  useContractWrite,
  useDisconnect,
  useSigner,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { TOKEN_ABI } from "../constants/tokenAbi";

const StateContext = createContext();

const contractAddress = "0x49F96B98d04e8F2530C4D667b3534c0401B141AC";
const tokenAddress = "0x335E93300b7e8C0E8527E46F128B4a5D2c354245";

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract(contractAddress);
  const { mutateAsync: createCampaign } = useContractWrite(
    contract,
    "createCampaign"
  );

  const address = useAddress();
  const signer = useSigner();
  const connect = useMetamask();
  const disconnect = useDisconnect();

  const publishCampaign = async (form) => {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        TOKEN_ABI,
        signer
      );
      const amountToApprove = ethers.utils.parseUnits(
        form.tokenAmount.toString(),
        18
      );
      const tx = await tokenContract.approve(contractAddress, amountToApprove);
      await tx.wait();

      const data = await createCampaign({
        args: [
          address, // owner
          form.title, // title
          form.description, // description
          form.target,
          new Date(form.deadline).getTime(), // deadline
          form.category ?? "",
          form.image,
          form.tokenAmount ?? "10000",
        ],
      });

      console.log("contract call success", data);
    } catch (error) {
      console.log("contract call failure", error);
    }
  };

  const getCampaigns = async () => {
    if (!contract) return [];

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
      donations: campaign.donations,
      pId: i,
    }));

    return parsedCampaings;
  };

  const getCampaignById = async (pId) => {
    const campaigns = await getCampaigns();
    return campaigns[Number.parseInt(pId)];
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter(
      (campaign) => campaign.owner === address
    );

    return filteredCampaigns;
  };

  const donate = async (pId, amount, tokenAmount) => {
    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
    const tx = await tokenContract.approve(contractAddress, tokenAmount);
    await tx.wait();

    const data = await contract.call("donateToCampaign", [pId], {
      value: ethers.utils.parseEther(
        ethers.utils.formatEther(amount.toString())
      ),
    });

    return data;
  };

  const refund = async (pId) => {
    const data = await contract.call("refundDonation", [pId]);

    return data;
  };

  const withdrawCampaignMoney = async (pId) => {
    const data = await contract.call("withdrawCampaignMoney", [pId]);

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
        refund,
        withdrawCampaignMoney,
        getDonations,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
