const env = import.meta.env.VITE_ENV || "development";
const getIPFsPubAddr = () => {
  return env === "development"
    ? ".ipfs.pub.dev.filedgr.network/#/home"
    : env === "testnet"
      ? ".ipfs.pub.test.filedgr.network/#/home"
      : ".ipfs.pub.filedgr.network/#/home";
};
const getIPFsPrivAddr = () => {
  return env === "development"
    ? ".ipfs.priv.dev.filedgr.network/"
    : env === "testnet"
      ? ".ipfs.priv.test.filedgr.network/"
      : ".ipfs.priv.filedgr.network/";
};

export const getIPFSIMGAddr = (cid: string) => {
  return `https://${cid}${getIPFsPubAddr()}`;
};
export const getIPFSIMGAddrPrivate = (cid: string) => {
  return `https://${cid}${getIPFsPrivAddr()}`;
};
