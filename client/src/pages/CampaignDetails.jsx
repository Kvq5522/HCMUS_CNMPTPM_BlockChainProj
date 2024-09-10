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
    withdrawCampaignMoney,
    refund,
  } = useStateContext();

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Loading campaign details...");
  const [amount, setAmount] = useState("");
  const [donators, setDonators] = useState([]);
  const [detail, setDetail] = useState(state);
  const [mounted, setMounted] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [donatorIndex, setDonatorIndex] = useState(-1);

  const remainingDays = daysLeft(detail.deadline);

  const fetchDonators = async () => {
    const data = await getDonations(detail.pId);

    setDonators(data);
    const index = data.findIndex((item) => item.donator === address);
    setDonatorIndex(index);
  };

  const handleDonate = async () => {
    try {
      setIsLoading(true);

      if (
        Number.parseInt(amount) >
          Number.parseInt(detail.tokensForSale) -
            Number.parseInt(detail.tokensSold) ||
        Number.parseInt(amount) < 0
      ) {
        alert("Invalid fund amount. Please enter a valid fund amount.");
        return;
      }

      setMessage("Handling donation...");

      const formatAmount = ethers.utils
        .parseUnits(amount, 18)
        .mul(ethers.utils.parseUnits(detail.tokenPrice, 18))
        .div(ethers.utils.parseUnits("1", 18))
        .toString();

      await donate(
        detail.pId,
        formatAmount,
        ethers.utils.parseUnits(amount, 18)
      );

      window.location.reload();
    } catch (error) {
      console.log(error);
      alert("Failed to handle donation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async () => {
    try {
      setIsLoading(true);
      setMessage("Handling refund...");

      if (detail.hasEnded) {
        alert("Campaign has ended yet.");
        return;
      }

      await refund(detail.pId);

      window.location.reload();
    } catch (error) {
      console.log(error);
      alert("Failed to handle refund. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCampaign = async () => {
    try {
      setIsLoading(true);
      setMessage("Ending campaign...");

      if (detail.hasWithdrawed || detail.hasEnded) {
        alert("Campaign has already ended or withdrawn.");
        return;
      }

      await endCampaign(detail.pId);
      window.location.reload();
    } catch (error) {
      console.log(error);
      alert("Failed to end campaign. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawCampaign = async () => {
    try {
      setIsLoading(true);
      setMessage("Withdrawing campaign money...");

      if (detail.hasWithdrawed) {
        alert("Campaign has already withdrawn.");
        return;
      }

      await withdrawCampaignMoney(detail.pId);
    } catch (error) {
      console.log(error);
      alert("Failed to withdraw campaign money. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contract) {
      (async () => {
        try {
          if (!contract) return;

          setIsLoading(true);
          setMessage("Loading campaign details...");

          const data = await getCampaignById(detail.pId);
          setDetail((detail) => ({ ...detail, ...data }));
        } catch (error) {
          console.log(error);
          alert("Failed to load campaign details. Please try again.");
        } finally {
          setIsLoading(false);
        }
      })();

      fetchDonators();
    }
  }, [contract, address]);

  return (
    <div>
      {isLoading && <Loader message={message} />}

      <div className="w-full flex md:flex-row flex-col mt-10 gap-[30px]">
        <div className="flex-1 flex-col">
          <img
            src={detail.image}
            alt="campaign"
            className="w-full h-[410px] object-cover rounded-xl"
          />
          <div className="relative w-full h-[5px] bg-[#3a3a43] mt-2">
            <div
              className="absolute h-full bg-[#4acd8d]"
              style={{
                width: `${calculateBarPercentage(
                  detail.target,
                  detail.amountCollected
                )}%`,
                maxWidth: "100%",
              }}
            ></div>
          </div>
        </div>

        <div className="flex md:w-[150px] w-full flex-wrap justify-between gap-[30px]">
          <CountBox
            title="Days Left"
            value={detail.hasEnded ? 0 : remainingDays}
          />
          <CountBox
            title={`Raised of ${detail.target}`}
            value={detail.amountCollected}
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
                  {detail.owner}
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
                {detail.hasEnded ? "Ended" : "Active"}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px]  uppercase">
              Category
            </h4>

            <div className="mt-[20px]">
              <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">
                {detail.category}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px]  uppercase">
              Story
            </h4>

            <div className="mt-[20px]">
              <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">
                {detail.description}
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

        {address == detail.owner && (
          <>
            <button
              onClick={
                detail.hasEnded ? handleWithdrawCampaign : handleEndCampaign
              }
              className="bg-[#8c6dfd] text-white h-[50px] mt-10 p-2 rounded-[10px]  font-epilogue font-semibold text-[18px] leading-[30px] cursor-pointer"
            >
              {detail.hasEnded ? "Withdraw money" : "End Campaign"}
            </button>
          </>
        )}

        {detail.owner != address && address && address != "" && (
          <div className="flex-1">
            <h4 className="font-epilogue font-semibold text-[18px] uppercase">
              Fund
            </h4>
            <div className="mt-[20px] mb-4 flex flex-col p-4 bg-[#1c1c24] rounded-[10px]">
              <p className="font-epilogue fount-medium text-[20px] leading-[30px] text-center text-[#808191]">
                Fund the campaign
              </p>

              <div className="mt-[1px]">
                <p className="text-white font-epilogue font-semibold my-2">
                  Available tokens: {detail.tokensForSale - detail.tokensSold}
                </p>

                <p className="text-white font-epilogue font-semibold my-2">
                  Token price: {detail.tokenPrice}
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
                    You have to pay{" "}
                    {(amount * detail.tokenPrice)
                      .toFixed(18)
                      .replace(/\.?0+$/, "")}{" "}
                    ETH to fund
                  </p>
                )}

                <CustomButton
                  btnType="button"
                  title="Fund Campaign"
                  styles="w-full bg-[#8c6dfd] mt-2"
                  handleClick={handleDonate}
                  disabled={
                    new Date(detail.deadline) < new Date() ||
                    detail.hasEnded ||
                    detail.tokensForSale - detail.tokensSold <= 0
                  }
                />
              </div>
            </div>
            {donatorIndex > -1 && (
              <>
                <h4 className="font-epilogue font-semibold text-[18px] uppercase">
                  Refund
                </h4>

                <div className="mt-[20px] flex flex-col p-4 bg-[#1c1c24] rounded-[10px]">
                  <p className="font-epilogue fount-medium text-[20px] leading-[30px] text-center text-[#808191]">
                    You've owned{" "}
                    {Math.floor(
                      donators[donatorIndex]?.donation /
                        Number.parseFloat(detail.tokenPrice)
                    )}{" "}
                    tokens
                    <br></br>
                    Do you wish to refund?
                  </p>

                  <div className="mt-[1px]">
                    <CustomButton
                      btnType="button"
                      title="Refund now"
                      styles="w-full bg-[#8c6dfd] mt-2"
                      handleClick={handleRefund}
                      disabled={
                        new Date(detail.deadline) < new Date() ||
                        detail.hasEnded ||
                        detail.tokensForSale - detail.tokensSold <= 0
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetails;
