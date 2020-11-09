const {BN, constants, expectEvent, expectRevert} = require('@openzeppelin/test-helpers');

const {expect} = require('chai');

const DigitalaxAccessControls = artifacts.require('DigitalaxAccessControls');
const DigitalaxMaterials = artifacts.require('DigitalaxMaterials');
const DigitalaxGarmentNFT = artifacts.require('DigitalaxGarmentNFT');
const DigitalaxGarmentFactoryTest = artifacts.require('DigitalaxGarmentFactory');

contract('DigitalaxGarmentFactory', function ([admin, minter, tokenHolder, designer, ...otherAccounts]) {
  const name = 'DigitalaxMaterials';
  const symbol = 'DXM';

  const randomStrandURI = 'randomStrandUri';
  const randomGarmentURI = 'randomGarmentUri';

  const TOKEN_ONE_ID = new BN('1');

  const STRAND_ONE_ID = new BN('1');
  const STRAND_TWO_ID = new BN('2');
  const STRAND_THREE_ID = new BN('3');
  const STRAND_FOUR_ID = new BN('4');
  const STRAND_FIVE_ID = new BN('5');

  beforeEach(async () => {
    this.accessControls = await DigitalaxAccessControls.new({from: admin});
    await this.accessControls.addMinterRole(minter, {from: admin});

    this.digitalaxMaterials = await DigitalaxMaterials.new(
      name,
      symbol,
      this.accessControls.address,
      {from: admin}
    );

    this.garment = await DigitalaxGarmentNFT.new(
      this.accessControls.address,
      this.digitalaxMaterials.address,
      {from: admin}
    );

    this.factory = await DigitalaxGarmentFactoryTest.new(
      this.garment.address,
      this.digitalaxMaterials.address,
      this.accessControls.address,
      {from: admin}
    );

    await this.accessControls.addSmartContractRole(this.factory.address, {from: admin});
  });

  describe('createNewChild()', () => {
    it('Creates a new strand successfully', async () => {
      await this.factory.createNewChild(randomStrandURI, {from: minter});
      expect(await this.digitalaxMaterials.uri(STRAND_ONE_ID)).to.be.equal(randomStrandURI);
    });

    it('Reverts when sender is not a minter', async () => {
      await expectRevert(
        this.factory.createNewChild(randomStrandURI, {from: tokenHolder}),
        'DigitalaxGarmentFactory.createNewChild: Sender must be minter'
      );
    });
  });

  describe('createNewChildren()', () => {
    it('Creates a multiple strands successfully', async () => {
      const strand2Uri = 'strand2uri';
      await this.factory.createNewChildren([randomStrandURI, strand2Uri], {from: minter});
      expect(await this.digitalaxMaterials.uri(STRAND_ONE_ID)).to.be.equal(randomStrandURI);
      expect(await this.digitalaxMaterials.uri(STRAND_TWO_ID)).to.be.equal(strand2Uri);
    });

    it('Reverts when sender is not a minter', async () => {
      await expectRevert(
        this.factory.createNewChildren([randomStrandURI, randomStrandURI], {from: tokenHolder}),
        'DigitalaxGarmentFactory.createNewChildren: Sender must be minter'
      );
    });
  });

  describe('mintParentWithChildren()', () => {
    beforeEach(async () => {
      await this.factory.createNewChildren(
        [randomStrandURI, randomStrandURI, randomStrandURI, randomStrandURI, randomStrandURI],
        {from: minter}
      ); // This will create strands with strand IDs: [1], [2], [3]
    });

    it('Can mint and link a strand', async () => {
      const strand1Amount = '1';
      const strand2Amount = '5';
      const strand3Amount = '2';
      const strand4Amount = '2';
      const strand5Amount = '2';
      const childTokenIds = [STRAND_ONE_ID, STRAND_TWO_ID, STRAND_THREE_ID, STRAND_FOUR_ID, STRAND_FIVE_ID];
      const {receipt} = await this.factory.mintParentWithChildren(
        randomGarmentURI,
        designer,
        childTokenIds,
        [strand1Amount, strand2Amount, strand3Amount, strand4Amount, strand5Amount], // amounts to mint and link
        tokenHolder,
        {from: minter}
      );

      await expectEvent(receipt, 'GarmentCreated', {garmentTokenId: TOKEN_ONE_ID});

      await expectStrandBalanceOfGarmentToBe(TOKEN_ONE_ID, STRAND_ONE_ID, strand1Amount);
      await expectStrandBalanceOfGarmentToBe(TOKEN_ONE_ID, STRAND_TWO_ID, strand2Amount);
      await expectStrandBalanceOfGarmentToBe(TOKEN_ONE_ID, STRAND_THREE_ID, strand3Amount);
      await expectStrandBalanceOfGarmentToBe(TOKEN_ONE_ID, STRAND_FOUR_ID, strand4Amount);
      await expectStrandBalanceOfGarmentToBe(TOKEN_ONE_ID, STRAND_FIVE_ID, strand5Amount);
      await expectGarmentToOwnAGivenSetOfStrandIds(TOKEN_ONE_ID, childTokenIds);
    });

    it('Reverts when sender does not have the minter role', async () => {
      await expectRevert(
        this.factory.mintParentWithChildren(
          randomGarmentURI,
          designer,
          [STRAND_ONE_ID, STRAND_TWO_ID, STRAND_THREE_ID],
          ['1', '1', '1'],
          tokenHolder,
          {from: tokenHolder}
        ),
        'DigitalaxGarmentFactory.mintParentWithChildren: Sender must be minter'
      );
    });
  });

  describe('mintParentWithoutChildren()', () => {

    it('Can mint parent without children', async () => {
      const {receipt} = await this.factory.mintParentWithoutChildren(
        randomGarmentURI,
        designer,
        tokenHolder,
        {from: minter}
      );

      await expectEvent(receipt, 'GarmentCreated', {garmentTokenId: TOKEN_ONE_ID});

      await expectGarmentToOwnAGivenSetOfStrandIds(TOKEN_ONE_ID, []);
    });

    it('Reverts when sender does not have the minter role', async () => {
      await expectRevert(
        this.factory.mintParentWithoutChildren(
          randomGarmentURI,
          designer,
          tokenHolder,
          {from: tokenHolder}
        ),
        'DigitalaxGarmentFactory.mintParentWithoutChildren: Sender must be minter'
      );
    });
  });

  const expectStrandBalanceOfGarmentToBe = async (garmentTokenId, strandId, expectedStrandBalance) => {
    const garmentStrandBalance = await this.garment.childBalance(
      garmentTokenId,
      this.digitalaxMaterials.address,
      strandId
    );
    expect(garmentStrandBalance).to.be.bignumber.equal(expectedStrandBalance);
  };

  const expectGarmentToOwnAGivenSetOfStrandIds = async (garmentId, childTokenIds) => {
    const garmentStrandIdsOwned = await this.garment.childIdsForOn(
      garmentId,
      this.digitalaxMaterials.address
    );

    expect(garmentStrandIdsOwned.length).to.be.equal(childTokenIds.length);
    garmentStrandIdsOwned.forEach((strandId, idx) => {
      expect(strandId).to.be.bignumber.equal(childTokenIds[idx]);
    });
  };
});
