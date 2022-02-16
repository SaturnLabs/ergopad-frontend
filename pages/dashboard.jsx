import AssetList from '@components/dashboard/AssetList';
import {
  Grid,
  Typography,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useWallet } from 'utils/WalletContext';
import CenterTitle from '@components/CenterTitle';
import VestingTable from '@components/dashboard/VestingTable';
import StackedAreaPortfolioHistory from '@components/dashboard/StackedAreaPortfolioHistory';
import PieChart from '@components/dashboard/PieChart';
import PriceChart from '@components/dashboard/PriceChart';

// CONFIG for portfolio history
// step size
const STEP_SIZE = 1;
const STEP_UNIT = 'w';

// placeholder data
const rawData2 = {
  address: 'No assets',
  balance: {
    ERG: {
      blockchain: 'ergo',
      balance: 0,
      unconfirmed: 0,
      tokens: [
        {
          tokenId: 'abcdefg',
          amount: 1,
          decimals: 0,
          name: 'No assets',
          price: 1,
        },
      ],
      price: 1,
    },
  },
};

const initHistoryData = [
  {
    token: 'No Assets',
    resolution: 1,
    history: [
      {
        timestamp: new Date().toISOString(),
        value: 0,
      },
      {
        timestamp: new Date(0).toISOString(),
        value: 0,
      },
    ],
  },
];

const wantedHoldingData = tokenDataArray(rawData2);

const portfolioValue = sumTotals(wantedHoldingData);

const defaultHoldingData = wantedHoldingData.map((item) => {
  const container = {};
  container.x = item.x;
  container.y = 0;
  return container;
});

defaultHoldingData[defaultHoldingData.length - 1].y = portfolioValue;

const paperStyle = {
  p: 3,
  borderRadius: 2,
  height: '100%',
};

const Dashboard = () => {
  const { wallet, dAppWallet } = useWallet();
  const [vestedTokens, setVestedTokens] = useState([]);
  const [holdingData, setHoldingData] = useState(defaultHoldingData);
  const [historyData, setHistoryData] = useState(initHistoryData);
  const [assetList, setAssetList] = useState(assetListArray(rawData2));
  const [imgNftList, setImgNftList] = useState([]);
  const [audNftList, setAudNftList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHoldingData(wantedHoldingData); // Setting the data that we want to display
  }, []);

  const noAssetSetup = () => {
    const noAssetList = [
      {
        id: 0,
        name: 'No assets',
      },
    ];
    setAssetList(noAssetList);
    setAudNftList(noAssetList);
    setImgNftList(noAssetList);
    const noAssetArray = tokenDataArray(rawData2);
    setHoldingData(noAssetArray);
    setHistoryData(initHistoryData);
  };

  useEffect(() => {
    async function getWalletData(addresses) {
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          // Authorization: auth?.accessToken ? `Bearer ${auth.accessToken}` : '',
        },
      };

      setLoading(true);
      const balancePromises = addresses.map((address) =>
        axios
          .get(`${process.env.API_URL}/asset/balance/${address}`, {
            ...defaultOptions,
          })
          .catch((err) => {
            console.log('ERROR FETCHING: ', err);
          })
      );
      const resolvedBalances = await Promise.all(balancePromises);
      const balances = resolvedBalances.map((res) => res?.data);
      const balance = reduceBalances(balances);

      if (balance) {
        const victoryData = tokenDataArray(balance);
        // create list of assets
        const initialAssetList = assetListArray(balance);

        const newImgNftList = [];
        const newAudNftList = [];
        const newAssetList = [];

        /**
         * Collect promises from ergoplatform and resolve them asynchronously
         */
        const assetListPromises = [];
        const indexMapper = {};
        for (let i = 0; i < initialAssetList.length; i++) {
          if (initialAssetList[i].id != 'ergid') {
            const promise = axios
              .get(
                `https://api.ergoplatform.com/api/v0/assets/${initialAssetList[i].id}/issuingBox`,
                { ...defaultOptions }
              )
              .catch((err) => {
                console.log('ERROR FETCHING: ', err);
              });
            indexMapper[initialAssetList[i].id] = i;
            assetListPromises.push(promise);
          } else {
            newAssetList[newAssetList.length] = initialAssetList[i];
          }
        }

        // resolve the promises
        const resolvedAssetList = await Promise.all(assetListPromises);
        resolvedAssetList.forEach((res) => {
          if (res?.data) {
            const data = res?.data;
            const i = indexMapper[data[0].assets[0].tokenId];
            const tokenObject = {
              name: data[0].assets[0].name,
              ch: data[0].creationHeight,
              description: toUtf8String(data[0].additionalRegisters.R5).substr(
                2
              ),
              r7: data[0].additionalRegisters.R7,
              r9: data[0].additionalRegisters?.R9
                ? resolveIpfs(
                    toUtf8String(data[0].additionalRegisters?.R9).substr(2)
                  )
                : undefined,
              r5: toUtf8String(data[0].additionalRegisters.R5).substr(2),
              ext: toUtf8String(data[0].additionalRegisters.R9)
                .substr(2)
                .slice(-4),
              token: initialAssetList[i].token,
              id: initialAssetList[i].id,
              amount: initialAssetList[i].amount,
              amountUSD: initialAssetList[i].amountUSD
                ? initialAssetList[i].amountUSD
                : '',
            };

            // if audio NFT
            if (
              tokenObject.ext == '.mp3' ||
              tokenObject.ext == '.ogg' ||
              tokenObject.ext == '.wma' ||
              tokenObject.ext == '.wav' ||
              tokenObject.ext == '.aac' ||
              tokenObject.ext == 'aiff' ||
              tokenObject.r7 == '0e020102'
            ) {
              newAudNftList[newAudNftList.length] = tokenObject;
            }
            // if image NFT
            else if (
              tokenObject.ext == '.png' ||
              tokenObject.ext == '.gif' ||
              tokenObject.ext == '.jpg' ||
              tokenObject.ext == 'jpeg' ||
              tokenObject.ext == '.bmp' ||
              tokenObject.ext == '.svg' ||
              tokenObject.ext == '.raf' ||
              tokenObject.ext == '.nef' ||
              tokenObject.r7 == '0e020101' ||
              tokenObject.r7 == '0e0430313031'
            ) {
              newImgNftList[newImgNftList.length] = tokenObject;
            } else {
              newAssetList[newAssetList.length] = tokenObject;
            }
          }
        });

        try {
          const res = await axios.get(
            `${process.env.API_URL}/asset/price/history/all?stepSize=${STEP_SIZE}&stepUnit=${STEP_UNIT}&limit=6`,
            { ...defaultOptions }
          );
          const priceHistory = res.data;
          const amountData = historyDataArray(balance);
          const orderingData = historyDataOrdering(balance);
          const totals = calculateHistoricTotal(
            priceHistory,
            amountData,
            orderingData
          );
          setHistoryData(totals);
        } catch (e) {
          console.log('Error: building history', e);
        }

        setHoldingData(victoryData);
        setAssetList(newAssetList);
        setAudNftList(newAudNftList);
        setImgNftList(newImgNftList);
      }

      setLoading(false);
    }

    const getVestedTokenData = async (address) => {
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      try {
        const res = await axios.get(
          `${process.env.API_URL}/vesting/vested/${address}`,
          { ...defaultOptions }
        );
        if (res.data.status === 'success') {
          setVestedTokens(res.data.vested);
        } else {
          setVestedTokens([]);
        }
      } catch (e) {
        console.log(e);
      }
    };

    const walletAddresses = [wallet, ...dAppWallet.addresses].filter(
      (x, i, a) => a.indexOf(x) == i && x
    );
    if (walletAddresses.length) {
      getWalletData(walletAddresses);
      getVestedTokenData(walletAddresses[0]);
    } else {
      noAssetSetup();
    }
  }, [wallet, dAppWallet.addresses]);

  return (
    <>
      <CenterTitle
        title="Dashboard"
        subtitle="Connect wallet above to see all your ergo assets"
        main="true"
      />
      <Container maxWidth="lg" sx={{ mx: 'auto' }}>
        <Grid container spacing={3} alignItems="stretch" sx={{ pt: 4 }}>
          <Grid item xs={12} md={12}>
            <Paper sx={paperStyle}>
              <PriceChart />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={paperStyle}>
              <Typography variant="h4">Wallet Holdings</Typography>
              {loading ? (
                <>
                  <CircularProgress color="inherit" />
                </>
              ) : (
                <>
                  <PieChart holdingData={holdingData} />
                </>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={paperStyle}>
              <Typography variant="h4">Portfolio History</Typography>
              {loading ? (
                <>
                  <CircularProgress color="inherit" />
                </>
              ) : (
                <>
                  <StackedAreaPortfolioHistory data={historyData} />
                </>
              )}
            </Paper>
          </Grid>
          {loading ? (
            <></>
          ) : (
            <>
              <Grid item xs={12} md={4}>
                <Paper sx={paperStyle}>
                  <AssetList assets={assetList} title="Assets" />
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={paperStyle}>
                  <AssetList
                    assets={imgNftList}
                    title="Image NFTs"
                    type="NFT"
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={paperStyle}>
                  <AssetList
                    assets={audNftList}
                    title="Audio NFTs"
                    type="NFT"
                  />
                </Paper>
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <Paper sx={paperStyle}>
              <Typography variant="h4" sx={{ fontWeight: '700' }}>
                Tokens Locked in Vesting Contracts
              </Typography>
              <VestingTable vestedObject={vestedTokens} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

function tokenDataArray(data) {
  const tokenObject = data.balance.ERG.tokens;
  const keys = Object.keys(tokenObject);
  const res = [];
  for (let i = 0; i < keys.length; i++) {
    const token = tokenObject[keys[i]];
    const obj = {
      x: token.name,
      y: token.price * (token.amount * Math.pow(10, -token.decimals)),
    };
    if (token.price > 0) res.push(obj);
  }
  const ergoValue = {
    x: 'Ergo',
    y: data.balance.ERG.price * data.balance.ERG.balance,
  };
  if (ergoValue.y > 0) res.unshift(ergoValue);
  return res;
}

const historyDataOrdering = (data) => {
  const tokenObject = data.balance.ERG.tokens;
  const keys = Object.keys(tokenObject);
  const res = {};
  for (let i = 0; i < keys.length; i++) {
    const token = tokenObject[keys[i]];
    if (token.price > 0) res[token.name.toLowerCase()] = i;
  }
  const ergoValue = data.balance.ERG.balance;
  if (ergoValue > 0) res['ergo'] = -1;
  return res;
};

const historyDataArray = (data) => {
  const tokenObject = data.balance.ERG.tokens;
  const keys = Object.keys(tokenObject);
  const res = {};
  for (let i = 0; i < keys.length; i++) {
    const token = tokenObject[keys[i]];
    if (token.price > 0)
      res[token.name.toLowerCase()] = {
        name: token.name,
        amount: token.amount * Math.pow(10, -token.decimals),
      };
  }
  const ergoValue = data.balance.ERG.balance;
  if (ergoValue > 0) res['ergo'] = { name: 'Ergo', amount: ergoValue };
  return res;
};

function assetListArray(data) {
  const tokenObject = data.balance.ERG.tokens;
  const keys = Object.keys(tokenObject);
  const res = [];
  for (let i = 0; i < keys.length; i++) {
    const token = tokenObject[keys[i]];
    const amount = +parseFloat(
      (token.amount * Math.pow(10, -token.decimals)).toFixed(2)
    );
    const price = (token.price * amount).toFixed(2);
    const obj = {
      token: token.name ? token.name.substring(0, 3).toUpperCase() : '',
      name: token.name ? token.name : '',
      id: token.tokenId,
      amount: amount,
      amountUSD: price,
    };
    res.push(obj);
  }
  const ergoValue = {
    token: 'ERG',
    name: 'Ergo',
    id: 'ergid',
    amount: data.balance.ERG.balance.toFixed(3),
    amountUSD: (data.balance.ERG.price * data.balance.ERG.balance).toFixed(2),
  };
  res.unshift(ergoValue);
  return res;
}

function sumTotals(data) {
  const value = data.map((item) => item.y).reduce((a, b) => a + b);
  return value;
}

function toUtf8String(hex) {
  if (!hex) {
    hex = '';
  }
  var str = '';
  for (var i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

function resolveIpfs(url) {
  const ipfsPrefix = 'ipfs://';
  if (!url.startsWith(ipfsPrefix)) return url;
  else return url.replace(ipfsPrefix, `https://cloudflare-ipfs.com/ipfs/`);
}

const calculateHistoricTotal = (priceHistory, amountData, orderingData) => {
  const ret = priceHistory
    .filter((tokenData) => amountData[tokenData.token.toLowerCase()])
    .map((tokenData) => {
      return {
        token: amountData[tokenData.token.toLowerCase()].name,
        history: tokenData.history.map((dataPoint) => {
          return {
            timestamp: dataPoint.timestamp,
            value:
              dataPoint.price *
              amountData[tokenData.token.toLowerCase()].amount,
          };
        }),
      };
    });
  ret.sort(
    (a, b) =>
      orderingData[a.token.toLowerCase()] - orderingData[b.token.toLowerCase()]
  );
  return ret;
};

const reduceBalances = (balances) => {
  if (balances.length === 0) {
    return null;
  }
  // deep copy
  const ret = JSON.parse(JSON.stringify(balances[0]));
  // aggregate
  const ergo = balances
    .map((balance) => balance.balance.ERG.balance)
    .reduce((a, c) => a + c, 0);
  ret.balance.ERG.balance = ergo;
  // aggregate tokens
  const tokenMap = {};
  balances.forEach((balance) => {
    const tokens = balance.balance.ERG.tokens;
    tokens.forEach((token) => {
      if (tokenMap[token.tokenId]) {
        tokenMap[token.tokenId].amount += token.amount;
      } else {
        tokenMap[token.tokenId] = token;
      }
    });
  });
  const tokens = Object.values(tokenMap);
  ret.balance.ERG.tokens = tokens;
  return ret;
};

export default Dashboard;
