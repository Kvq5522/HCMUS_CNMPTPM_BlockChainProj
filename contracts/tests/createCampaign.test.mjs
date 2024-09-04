import Web3 from "web3";
import { assert } from "chai";
import CrowdFunding from "../artifacts/contracts/CrowdFunding.sol/CrowdFunding.json";
import IERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json"; // Adjust the path as needed
import { logo, menu, search, thirdweb } from "../assets";

const web3 = new Web3("http://localhost:8545"); // Adjust the URL as needed

let accounts;
let crowdFunding;
let token;
const tokenAddress = "0x335E93300b7e8C0E8527E46F128B4a5D2c354245"; // Replace with your token contract address

before(async () => {
  accounts = await web3.eth.getAccounts();

  // Deploy the IERC20 token contract
  token = new web3.eth.Contract(IERC20.abi);
  token = await token
    .deploy({ data: IERC20.bytecode })
    .send({ from: accounts[0], gas: "1000000" });

  // Deploy the CrowdFunding contract
  crowdFunding = new web3.eth.Contract(CrowdFunding.abi);
  crowdFunding = await crowdFunding
    .deploy({ data: CrowdFunding.bytecode, arguments: [token.options.address] })
    .send({ from: accounts[0], gas: "1000000" });

  // Mint some tokens to accounts[0]
  await token.methods
    .mint(accounts[0], web3.utils.toWei("1000", "ether"))
    .send({ from: accounts[0] });
});

describe("CrowdFunding Contract", () => {
  it("should create a campaign successfully", async () => {
    const title = "Test Campaign";
    const description = "This is a test campaign";
    const target = web3.utils.toWei("10", "ether");
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
    const image = "https://example.com/image.png";
    const tokenPrice = web3.utils.toWei("1", "ether");
    const tokensForSale = web3.utils.toWei("10", "ether");

    // Approve the CrowdFunding contract to spend tokens
    await token.methods
      .approve(crowdFunding.options.address, tokensForSale)
      .send({ from: accounts[0] });

    // Create the campaign
    const result = await crowdFunding.methods
      .createCampaign(
        title,
        description,
        target,
        deadline,
        image,
        tokenPrice,
        tokensForSale
      )
      .send({ from: accounts[0] });

    // Check the campaign details
    const campaignId = result.events.CampaignCreated.returnValues.campaignId;
    const campaign = await crowdFunding.methods.campaigns(campaignId).call();

    assert.equal(campaign.owner, accounts[0]);
    assert.equal(campaign.title, title);
    assert.equal(campaign.description, description);
    assert.equal(campaign.target, target);
    assert.equal(campaign.deadline, deadline);
    assert.equal(campaign.image, image);
    assert.equal(campaign.tokenPrice, tokenPrice);
    assert.equal(campaign.tokensForSale, tokensForSale);
    assert.equal(campaign.tokensSold, "0");
  });
});
