import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import { useStateContext } from "../context";
import { CountBox, CustomButton, Loader } from "../components";
import { calculateBarPercentage, daysLeft } from "../utils";
import { thirdweb } from "../assets";

const CampaignDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const {
    donate,
    getDonations,
    contract,
    address,
    getCampaignById,
    endCampaign,
  } = useStateContext();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Loading campaign details...");
  const [amount, setAmount] = useState("");
  const [donators, setDonators] = useState([]);
  const [isDonator, setIsDonator] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  console.log(state);

  const remainingDays = daysLeft(state.deadline);

  const fetchDonators = async () => {
    const data = await getDonations(state.pId);

    setDonators(data);
    setIsDonator(data.find((donator) => donator.donator === address));
  };

  const handleDonate = async () => {
    try {
      setIsLoading(true);

      if (
        Number.parseInt(amount) >
          Number.parseInt(state.tokensForSale) -
            Number.parseInt(state.tokensSold) ||
        Number.parseInt(amount) < 0
      ) {
        alert("Invalid fund amount. Please enter a valid fund amount.");
        return;
      }

      setMessage("Handling donation...");
      await donate(state.pId, amount);

      navigate("/");
      setIsLoading(false);
    } catch (error) {
      alert("Failed to handle donation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCampaign = async () => {
    try {
      setIsLoading(true);
      setMessage("Ending campaign...");

      if (state.hasWithdrawed || !state.hasEnded) {
        alert("Campaign has already ended or withdrawn.");
        return;
      }

      const data = await endCampaign(state.pId);
    } catch (error) {
      console.log(error);
      alert("Failed to end campaign. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawCampaign = async () => {};

  useEffect(() => {
    (async () => {
      try {
        setMessage("Loading campaign details...");
        const data = await getCampaignById(state.pId);
      } catch (error) {
        console.log(error);
        alert("Failed to load campaign details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (contract) fetchDonators();
  }, [contract, address]);

  return (
    <div>
      {isLoading && <Loader message={message} />}

      <div className="w-full flex md:flex-row flex-col mt-10 gap-[30px]">
        <div className="flex-1 flex-col">
          <img
            src={state.image}
            alt="campaign"
            className="w-full h-[410px] object-cover rounded-xl"
          />
          <div className="relative w-full h-[5px] bg-[#3a3a43] mt-2">
            <div
              className="absolute h-full bg-[#4acd8d]"
              style={{
                width: `${calculateBarPercentage(
                  state.target,
                  state.amountCollected
                )}%`,
                maxWidth: "100%",
              }}
            ></div>
          </div>
        </div>

        <div className="flex md:w-[150px] w-full flex-wrap justify-between gap-[30px]">
          <CountBox
            title="Days Left"
            value={state.hasEnded ? 0 : remainingDays}
          />
          <CountBox
            title={`Raised of ${state.target}`}
            value={state.amountCollected}
          />
          <CountBox title="Total Backers" value={donators.length} />
        </div>
      </div>

      <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
        <div className="flex-[2] flex flex-col gap-[40px]">
          <div>
            <h4 className="font-epilogue font-semibold text-[18px]  uppercase">
              Creator
            </h4>

            <div className="mt-[20px] flex flex-row items-center flex-wrap gap-[14px]">
              <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#2c2f32] cursor-pointer">
                <img
                  src={thirdweb}
                  alt="user"
                  className="w-[60%] h-[60%] object-contain"
                />
              </div>
              <div>
                <h4 className="font-epilogue font-semibold text-[14px]  break-all">
                  {state.owner}
                </h4>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px]  uppercase">
              Status
            </h4>

            <div className="mt-[20px]">
              <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">
                {state.hasEnded ? "Ended" : "Active"}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px]  uppercase">
              Category
            </h4>

            <div className="mt-[20px]">
              <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">
                {state.category}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px]  uppercase">
              Story
            </h4>

            <div className="mt-[20px]">
              <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">
                {state.description}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px]  uppercase">
              Donators
            </h4>

            <div className="mt-[20px] max-h-[200px] overflow-auto flex flex-col gap-4">
              {donators.length > 0 ? (
                donators.map((item, index) => (
                  <div
                    key={`${item.donator}-${index}`}
                    className="flex justify-between items-center gap-4"
                  >
                    <p className="font-epilogue font-normal text-[16px] text-[#b2b3bd] leading-[26px] break-ll">
                      {index + 1}. {item.donator}
                    </p>
                    <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] break-ll">
                      {item.donation}
                    </p>
                  </div>
                ))
              ) : (
                <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">
                  No donators yet. Be the first one!
                </p>
              )}
            </div>
          </div>
        </div>

        {address == state.owner && (
          <>
            <button
              onClick={
                state.hasEnded ? handleWithdrawCampaign : handleEndCampaign
              }
              className="bg-[#8c6dfd] text-white h-[50px] mt-10 p-2 rounded-[10px]  font-epilogue font-semibold text-[18px] leading-[30px] cursor-pointer"
            >
              {state.hasEnded ? "Withdraw money" : "End Campaign"}
            </button>
          </>
        )}

        {state.owner != address && (
          <div className="flex-1">
            <h4 className="font-epilogue font-semibold text-[18px] uppercase">
              Fund
            </h4>

            <div className="mt-[20px] flex flex-col p-4 bg-[#1c1c24] rounded-[10px]">
              <p className="font-epilogue fount-medium text-[20px] leading-[30px] text-center text-[#808191]">
                Fund the campaign
              </p>

              <div className="mt-[1px]">
                <p className="text-white font-epilogue font-semibold my-2">
                  Available tokens: {state.tokensForSale - state.tokensSold}
                </p>

                <p className="text-white font-epilogue font-semibold my-2">
                  Token price: {state.tokenPrice}
                </p>

                <input
                  type="number"
                  placeholder="Token 1"
                  className="w-full py-[10px] sm:px-[20px] px-[15px] text-white outline-none  border-[1px] border-[#3a3a43] bg-transparent font-epilogue  text-[18px] leading-[30px] placeholder:text-[#4b5264] rounded-[10px]"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />

                {Number.parseInt(amount) > 0 && (
                  <p className="text-white font-epilogue font-semibold my-2">
                    You have to pay {amount * state.tokenPrice} ETH to fund
                  </p>
                )}

                <CustomButton
                  btnType="button"
                  title="Fund Campaign"
                  styles="w-full bg-[#8c6dfd] mt-2"
                  handleClick={handleDonate}
                  disabled={
                    new Date(state.deadline) < new Date() ||
                    state.hasEnded ||
                    state.tokensForSale - state.tokensSold > 0
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetails;
