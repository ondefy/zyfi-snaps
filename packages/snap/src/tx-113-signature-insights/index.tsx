import {ethers} from "ethers";
import { OnTransactionHandler, OnSignatureHandler, SeverityLevel} from "@metamask/snaps-sdk";
import { Box, Heading, Text, Bold, Link , Row, Image, Divider, Copyable, Italic} from "@metamask/snaps-sdk/jsx";
import svgIcon from "../images/blue-dark-sign3.png";
import { utils } from "@metamask/snaps-cli";
const abiCoder = new ethers.utils.AbiCoder();
const paymasterFlowInterface =  new ethers.utils.Interface([
  "function general(bytes calldata input) external",
  "function approvalBased(address _feeToken, uint256 _allowance, bytes calldata _innerInput) external"
]);
export const onSignature : OnSignatureHandler = async ({signature, signatureOrigin})=> {

  const {from, data, signatureMethod} = signature;

  let domain;
  let explorerLinks:any = {
    "300" : "https://sepolia.explorer.zksync.io/address/",
    "324": "https://explorer.zksync.io/address/", 
    "388": "",
    "282":"",
    "11124":"",
   "1_612_127":""
    };
  if (
    signatureMethod === 'eth_signTypedData_v3' ||
    signatureMethod === 'eth_signTypedData_v4'
  ) {
    domain = data.domain;
    if(!(domain.chainId == '300' || domain.chainId == '324')){
      return null;
    }
  }
  else{
    return null;
  }
  const message = data.message;
  console.log(message);
  if(message.txType != "113"){
    return {
      content: (
      <Box>
      <Heading>Zyfi Signature Insights
      </Heading>
      <Text>Not a ZKsync 113 type transaction</Text>
    </Box>
      )
    }
  }
  //<Heading>Zyfi Signature Insights </Heading>
  //<Image src={svgIcon}></Image>
  //<Divider />
  //<Text>From:</Text>
  //<Copyable value={fromAddress} />
  //<Text>To:</Text>
  //<Copyable value={toAddress} />
  //<Text>Paymaster:</Text>
  //<Copyable value={paymasterAddress} />
  let link = explorerLinks[domain.chainId];
  let fromAddress = ethers.utils.getAddress("0x" + (BigInt(message.from).toString(16)));
  let toAddress = ethers.utils.getAddress("0x" + BigInt(message.to).toString(16));
  let paymasterAddress = "";
  let paymasterType = "";
  let feeTokenAddress = "";
  let feeTokenAmount;
  if(message.paymaster != undefined){
    paymasterAddress = ethers.utils.getAddress("0x" + BigInt(message.paymaster).toString(16));
    const type = message.paymasterInput.substring(0,10);
    if(type == paymasterFlowInterface.getSighash("general(bytes calldata input)")){
      paymasterType = "General";

    }
    else if(type == paymasterFlowInterface.getSighash("approvalBased")){
      paymasterType = "Approval Based";
      const decodePaymasterInput = paymasterFlowInterface.decodeFunctionData("approvalBased",message.paymasterInput);
      feeTokenAddress = decodePaymasterInput._feeToken;
      console.log("here");
      //feeTokenAmount = (decodePaymasterInput._allowance.toString()/10**18).toString();
    }
  
  }

  return {
    content: (
      <Box>
        {/*<Image src={svgIcon}></Image>*/}
        <Heading>Zyfi Signature Insight</Heading>
        <Divider/>
        <Text>From:</Text>
        <Copyable value={fromAddress} />
        <Link href={link+fromAddress}>Explorer</Link>
        <Text>To:</Text>
        <Copyable value={ toAddress} />
        <Link href={link+toAddress}>Explorer</Link>
        <Divider/>

        {paymasterType == "Approval Based" ? <Box>
    
        <Text>Paymaster Type: <Bold> {paymasterType}</Bold>
        </Text>
        <Text> Paymaster Address: </Text>
        <Copyable value={paymasterAddress} />
        <Link href={link+paymasterAddress}>Explorer</Link>
        
        <Text> Fee Token: </Text>
        <Copyable value={feeTokenAddress} />
        <Link href={link+feeTokenAddress}>Explorer</Link>
        <Text> Allowance Amount:
        <Bold> {feeTokenAmount} </Bold>
        </Text>

        </Box>
        :
        <Text>Paymaster Type: <Bold> {paymasterType}</Bold>
        </Text>
        }

      </Box>
    ),
    severity: SeverityLevel.Critical,
  };
}
