const FactoryArtifact = require('../../artifacts/DigitalaxGarmentFactory.json');
const MaterialsArtifact = require('../../artifacts/DigitalaxMaterials.json');
const {FUND_MULTISIG_ADDRESS} = require('../constants');

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log(
    'Deploying auction with signer address:',
    deployerAddress
  );

  const {GARMENT_FACTORY_ADDRESS, ERC1155_MATERIALS_ADDRESS} = process.env;
  console.log(`GARMENT_FACTORY_ADDRESS found [${GARMENT_FACTORY_ADDRESS}]`);
  console.log(`ERC1155_MATERIALS_ADDRESS found [${ERC1155_MATERIALS_ADDRESS}]`);

  const factory = new ethers.Contract(
    GARMENT_FACTORY_ADDRESS,
    FactoryArtifact.abi,
    deployer
  );

  const materials = new ethers.Contract(
    ERC1155_MATERIALS_ADDRESS,
      MaterialsArtifact.abi,
     deployer
  );


  // // Create children

  // let tx = await factory.createNewChildren([
  //   require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/tester_exclusive/hash.json`).uri,
  //   require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/tester_semirare/hash.json`).uri,
  //   require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/tester_common/hash.json`).uri,
  // ]);

  let tx = await factory.createNewChildren([
      require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/3_rest_in_green/hash.json`).uri, // Harajuku -ex
      require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/3_gridded_greenery/hash.json`).uri, // Imagineer -sr
      require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/3_sit_in_green/hash.json`).uri, // Free colour -co
      require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/3_apis_mechanicus/hash.json`).uri, // Transformation -ex
       require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/3_crux_mechanicus/hash.json`).uri, // Chrysalis -sr
       require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/3_astral_mechanicus/hash.json`).uri, // First Armour -co
      require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/3_stripes/hash.json`).uri, // 55 stripes exclusive few charm
      require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/3_waves/hash.json`).uri, // 56 waves sr beyond me
      require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/3_clouds/hash.json`).uri, // 57 clouds commo blue funk
      require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/3_you_turn_my_heart_upside_down/hash.json`).uri, // 66 turn heart excl cosmic one
      require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/3_balance_of_bliss/hash.json`).uri, // 65 balance bliss sr hagemonos
      require(`../../../../nft-minting-scripts/auction-metadata/token-data/children/3_wrapped_in_darkness/hash.json`).uri, // 58 wrapped darkness common distant mark
  ]);

  const createChildIds = await new Promise((resolve, reject) => {
      materials.on('ChildrenCreated',
        async (tokenIds, event) => {
          const block = await event.getBlock();
          console.log(`Children created at time ${block.timestamp}`);
          resolve(tokenIds);
        });
  });

  await tx.wait();

  console.log(`Children created for token ids:`);
  console.log(`[${createChildIds}]`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
