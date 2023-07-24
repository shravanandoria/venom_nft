"use client";
import React, { useEffect, useState } from "react";

//IMPORTING ABI'S
import nftAbi from "../../abi/Nft.abi.json";
import collectionAbi from "../../abi/Collection.abi.json";
import indexAbi from "../../abi/Index.abi.json";
import tokenRootAbi from "../../abi/TokenRoot.abi.json";
import tokenWalletAbi from "../../abi/TokenWallet.abi.json";

import { initVenomConnect } from "./components/venom-connect";
import { VenomConnect } from "venom-connect";
import {
  Address,
  ProviderRpcClient,
  Subscriber,
} from "everscale-inpage-provider";

export default function Home() {
  const COLLECTION_ADDRESS =
    "0:c22a4b56b2b3e197ec790ab63d128d612088e86e22ec75bf02684c6388571c34";

  const [venomConnect, setVenomConnect] = useState();

  const [collectionItems, setCollectionItem] = useState([]);
  const [listIsEmpty, setListIsEmpty] = useState(false);

  const [venomProvider, setVenomProvider] = useState();
  const [standaloneProvider, setStandAloneProvider] = useState();
  const [address, setAddress] = useState();

  const getAddress = async (provider) => {
    const providerState = await provider?.getProviderState?.();
    return providerState?.permissions.accountInteraction?.address.toString();
  };

  const init = async () => {
    const _venomConnect = await initVenomConnect();
    setVenomConnect(_venomConnect);
  };

  const checkAuth = async (_venomConnect) => {
    const auth = await _venomConnect?.checkAuth();
    if (auth) await getAddress(_venomConnect);
  };

  const initStandalone = async () => {
    const standalone = await venomConnect?.getStandalone();
    setStandAloneProvider(standalone);
    return standalone;
  };

  const onLogin = async () => {
    // if (!venomConnect) return;
    console.log("connectiong wallet...");
    await venomConnect.connect();
  };

  const onConnect = async (provider) => {
    setVenomProvider(provider);
    await onProviderReady(provider);
  };

  const onDisconnect = async () => {
    venomProvider?.disconnect();
    setAddress(undefined);
  };

  const onProviderReady = async (provider) => {
    const venomWalletAddress = provider
      ? await getAddress(provider)
      : undefined;
    setAddress(venomWalletAddress);
  };

  // Extract an preview field of NFT's json
  const getNftImage = async (provider, nftAddress) => {
    const nftContract = new provider.Contract(nftAbi, nftAddress);
    // calling getJson function of NFT contract
    const getJsonAnswer = await nftContract.methods
      .getJson({ answerId: 0 })
      .call();

    const json = JSON.parse(getJsonAnswer.json ?? "{}");
    return json;
  };

  // Returns array with NFT's images urls
  const getCollectionItems = async (provider, nftAddresses) => {
    return Promise.all(
      nftAddresses.map(async (nftAddress) => {
        const imgInfo = await getNftImage(provider, nftAddress);
        return imgInfo;
      })
    );
  };

  const getNftCodeHash = async (provider) => {
    const collectionAddress = new Address(COLLECTION_ADDRESS);
    const contract = new provider.Contract(collectionAbi, collectionAddress);
    const { codeHash } = await contract.methods
      .nftCodeHash({ answerId: 0 })
      .call({ responsible: true });
    return BigInt(codeHash).toString(16);
  };

  // Method, that return NFT's addresses by single query with fetched code hash
  const getNftAddresses = async (codeHash) => {
    const addresses = await standaloneProvider?.getAccountsByCodeHash({
      codeHash,
    });
    return addresses?.accounts;
  };

  const loadNFTs_collection = async (provider) => {
    setListIsEmpty(false);
    try {
      const nftCodeHash = await getNftCodeHash(provider);
      if (!nftCodeHash) {
        return;
      }
      const nftAddresses = await getNftAddresses(nftCodeHash);
      if (!nftAddresses || !nftAddresses.length) {
        if (nftAddresses && !nftAddresses.length) setListIsEmpty(true);
        return;
      }
      const nftURLs = await getCollectionItems(provider, nftAddresses);
      setCollectionItem(nftURLs);
    } catch (e) {
      console.error(e);
    }
  };
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // FETCHING USER NFT'S
  const [listIsEmpty_user, setListIsEmpty_user] = useState(false);

  const saltCode = async (provider, ownerAddress) => {
    // Index StateInit you should take from github. It ALWAYS constant!
    const INDEX_BASE_64 =
      "te6ccgECIAEAA4IAAgE0AwEBAcACAEPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAgaK2zUfBAQkiu1TIOMDIMD/4wIgwP7jAvILHAYFHgOK7UTQ10nDAfhmifhpIds80wABn4ECANcYIPkBWPhC+RDyqN7TPwH4QyG58rQg+COBA+iogggbd0CgufK0+GPTHwHbPPI8EQ4HA3rtRNDXScMB+GYi0NMD+kAw+GmpOAD4RH9vcYIImJaAb3Jtb3Nwb3T4ZNwhxwDjAiHXDR/yvCHjAwHbPPI8GxsHAzogggujrde64wIgghAWX5bBuuMCIIIQR1ZU3LrjAhYSCARCMPhCbuMA+EbycyGT1NHQ3vpA0fhBiMjPjits1szOyds8Dh8LCQJqiCFus/LoZiBu8n/Q1PpA+kAwbBL4SfhKxwXy4GT4ACH4a/hs+kJvE9cL/5Mg+GvfMNs88gAKFwA8U2FsdCBkb2Vzbid0IGNvbnRhaW4gYW55IHZhbHVlAhjQIIs4rbNYxwWKiuIMDQEK103Q2zwNAELXTNCLL0pA1yb0BDHTCTGLL0oY1yYg10rCAZLXTZIwbeICFu1E0NdJwgGOgOMNDxoCSnDtRND0BXEhgED0Do6A34kg+Gz4a/hqgED0DvK91wv/+GJw+GMQEQECiREAQ4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAD/jD4RvLgTPhCbuMA0x/4RFhvdfhk0ds8I44mJdDTAfpAMDHIz4cgznHPC2FeIMjPkll+WwbOWcjOAcjOzc3NyXCOOvhEIG8TIW8S+ElVAm8RyM+EgMoAz4RAzgH6AvQAcc8LaV4gyPhEbxXPCx/OWcjOAcjOzc3NyfhEbxTi+wAaFRMBCOMA8gAUACjtRNDT/9M/MfhDWMjL/8s/zsntVAAi+ERwb3KAQG90+GT4S/hM+EoDNjD4RvLgTPhCbuMAIZPU0dDe+kDR2zww2zzyABoYFwA6+Ez4S/hK+EP4QsjL/8s/z4POWcjOAcjOzc3J7VQBMoj4SfhKxwXy6GXIz4UIzoBvz0DJgQCg+wAZACZNZXRob2QgZm9yIE5GVCBvbmx5AELtRNDT/9M/0wAx+kDU0dD6QNTR0PpA0fhs+Gv4avhj+GIACvhG8uBMAgr0pCD0oR4dABRzb2wgMC41OC4yAAAADCD4Ye0e2Q==";
    // Gettind a code from Index StateInit
    const tvc = await provider.splitTvc(INDEX_BASE_64);
    if (!tvc.code) throw new Error("tvc code is empty");
    const ZERO_ADDRESS =
      "0:0000000000000000000000000000000000000000000000000000000000000000";
    // Salt structure that we already know
    const saltStruct = [
      { name: "zero_address", type: "address" },
      { name: "owner", type: "address" },
      { name: "type", type: "fixedbytes3" }, // according on standards, each index salted with string 'nft'
    ];
    const { code: saltedCode } = await provider.setCodeSalt({
      code: tvc.code,
      salt: {
        structure: saltStruct,
        abiVersion: "2.1",
        data: {
          zero_address: new Address(ZERO_ADDRESS), // just pass it here for code hash you need
          owner: new Address(ownerAddress),
          type: btoa("nft"),
        },
      },
    });
    return saltedCode;
  };

  // Method, that return Index'es addresses by single query with fetched code hash
  const getAddressesFromIndex = async (codeHash) => {
    const addresses = await standaloneProvider?.getAccountsByCodeHash({
      codeHash,
    });
    return addresses?.accounts;
  };

  const getNftsByIndexes = async (provider, indexAddresses) => {
    const nftAddresses = await Promise.all(
      indexAddresses.map(async (indexAddress) => {
        const indexContract = new provider.Contract(indexAbi, indexAddress);
        const indexInfo = await indexContract.methods
          .getInfo({ answerId: 0 })
          .call();
        return indexInfo.nft;
      })
    );
    return getCollectionItems(provider, nftAddresses);
  };

  const loadNFTs_user = async (provider, ownerAddress) => {
    setListIsEmpty_user(false);
    try {
      // Take a salted code
      const saltedCode = await saltCode(provider, ownerAddress);
      // Hash it
      const codeHash = await provider.getBocHash(saltedCode);
      if (!codeHash) {
        return;
      }
      // Fetch all Indexes by hash
      const indexesAddresses = await getAddressesFromIndex(codeHash);
      if (!indexesAddresses || !indexesAddresses.length) {
        if (indexesAddresses && !indexesAddresses.length)
          setListIsEmpty_user(true);
        return;
      }
      // Fetch all image URLs
      const nftURLs = await getNftsByIndexes(provider, indexesAddresses);
      console.log({ nftURLs });
      // setMyCollectionItems(nftURLs);
    } catch (e) {
      console.error(e);
    }
  };

  const create_nft = async () => {
    try {
      const ipfs_image = "sample Image";

      const nft_json = JSON.stringify({
        type: "Basic NFT",
        id: 3,
        name: "shravan nft",
        description: "demo nft",
        preview: {
          source: "image",
          mimetype: "image/png",
        },
        files: [
          {
            source: "sample source",
            mimetype: "sample mimetype",
          },
        ],
        attributes: "my attr",
        external_url: "https://venomart.space",
        nft_image: "ipfs_image",
        collection_name: "data.collection",
      });

      const contract = new venomProvider.Contract(
        collectionAbi,
        COLLECTION_ADDRESS
      );

      const { count: id } = await contract.methods
        .totalSupply({ answerId: 0 })
        .call();
      console.log({ id });

      // const subscriber = new Subscriber(venomProvider);
      // contract
      //   .events(subscriber)
      //   .filter((event) => event.event === "tokenCreated")
      //   .on(async (event) => {
      //     const { nft: nftAddress } = await contract.methods
      //       .nftAddress({ answerId: 0, id: id })
      //       .call();

      //     console.log({ event: event });
      //   });
      const outputs = await contract.methods
        .mintNft({ json: JSON.stringify({ name: "shravan", age: "24" }) })
        .send({
          from: new Address(address),
          amount: "1000000000",
        });

      console.log({ outputs });
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    // connect event handler
    console.log("render");
    const off = venomConnect?.on("connect", onConnect);
    if (venomConnect) {
      initStandalone();
      checkAuth(venomConnect);
    }
    // just an empty callback, cuz we don't need it
    return () => {
      off?.();
    };
  }, [venomConnect]);

  useEffect(() => {
    if (address && standaloneProvider)
      loadNFTs_user(standaloneProvider, address);
    if (!address) setListIsEmpty_user(false);
  }, [address]);

  //////////////////////////////////////////////////////////////////////////
  //TIP-3
  const TOKEN_ROOT_ADDRESS =
    "0:bf6adad7315850d05e010c55ea46f84e0aecfb4788783a31fc0694a7a6436883";

  const [balance, setBalance] = useState();
  const [tokenWalletAddress, setTokenWalletAddress] = useState();

  const getTokenWalletAddress = async (provider, userWalletAddress) => {
    console.log({ provider, userWalletAddress });
    const contract = new provider.Contract(
      tokenRootAbi,
      new Address(TOKEN_ROOT_ADDRESS)
    );
    const tokenWallet = await contract.methods
      .walletOf({
        answerId: 0,
        walletOwner: userWalletAddress,
      })
      .call();
    if (!tokenWallet) return undefined;
    return tokenWallet.value0._address;
  };

  const updateBalance = async () => {
    if (!tokenWalletAddress || !standaloneProvider) return;
    try {
      const contract = new standaloneProvider.Contract(
        tokenWalletAbi,
        new Address(tokenWalletAddress)
      );
      // We check a contract state here to acknowledge if TokenWallet already deployed
      // As you remember, wallet can be deployed with first transfer on it.
      // If our wallet isn't deployed, so it's balance is 0 :)
      const contractState = await venomProvider.rawApi.getFullContractState({
        address: tokenWalletAddress,
      });
      if (contractState.state) {
        // But if this deployed, just call a balance function
        const result = await contract.methods.balance({ answerId: 0 }).call();
        const tokenBalance = result.value0;
        // formatBalance is just a beauty helper to divide our balance by 10 ** 9 (decimals...our TIP-3 decimals is 9)
        setBalance(formatBalance(tokenBalance));
      } else {
        setBalance("0");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // updating of user's TokenWallet (TIP-3) address (placed in hook)
  const updateTokenWalletAddress = async (provider, userWalletAddress) => {
    if (tokenWalletAddress) return;
    const walletAddress = await getTokenWalletAddress(
      provider,
      userWalletAddress
    );
    setTokenWalletAddress(walletAddress);
  };

  useEffect(() => {
    if (address && standaloneProvider) {
      updateTokenWalletAddress(standaloneProvider, address);
    }
  }, [address]);

  useEffect(() => {
    if (tokenWalletAddress) updateBalance();
  }, [tokenWalletAddress]);

  return (
    <div className="box">
      <button onClick={create_nft}>get id</button>
      <header>
        {address ? (
          <>
            {" "}
            <p>{address}</p>
            <a className="logout" onClick={onDisconnect}>
              Logout
            </a>
          </>
        ) : (
          <button className="btn" onClick={onLogin}>
            Connect wallet
          </button>
        )}
      </header>
    </div>
  );
}
