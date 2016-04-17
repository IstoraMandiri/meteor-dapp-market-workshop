Take a look at the following in order to get a basic idea of what our app is going to do from the point of view of 3 types of user.

It's using a form of written English called gherkin - a standard that could be converted into [cucumber](https://cucumber.io/) acceptance tests typically used in Behavior Driven Development (BDD).

*User Story: Market Manager*

```gherkin
Feature: Market Management
  
  Markets will contain a list of related products for sale
  Market managers should be able to create markets and set a relevant description 
  so that buyers and sellers can determine whether they want to partake in the market.
  
  Background:
    As a Market Manager
    Given I am on the landing page

  Scenario: Deploy New Market
    When I click on the 'deploy market' button
    And I complete the market metadata form
    Then a new market is deployed
    And it's metadata is correct

  Scenario: Browse a Market
    When I enter a market address that has products
    And I click the 'go to market' button
    Then I am taken to the correct market page
    And I can see the market metadata
    And I can see the list of products

  Scenario: Edit Market Metadata
    Given I am on a market that I own
    When I click on the 'edit metadata' button
    And I complete the 'market metadata' form
    Then the market is updated
    And the market metadata is correct
```

*User Story: Product Seller*

```gherkin
Feature: View and deploy a product

  Products are single escrow contracts that contain metadata about the product
  Sellers should be able to create and edit the metadata of products they are selling 
  The escrow contract requires the seller to deposit double the value of the product
  
  Background:
    As a seller
    Given I am on a market page
    And the market has a product

  Scenario: Browse Product
    When I click on a product item
    Then I am taken to the correct product page
    And the product metadata is correct

  Scenario: Deploy New Product
    When I click on the 'deploy product' button
    And I set the price to 2
    And I complete the 'product metadata' form
    Then my deposit is transferred    
    And I am taken to the correct product page
    And the product price is 2
    And the product metadata is correct

Feature: Manage product sales

  Background:
    As a seller
    Given I am on a product item that I am selling

  Scenario: Edit Product Metadata
    When I click on the 'edit metadata' button
    And I complete the 'product metadata' form
    Then the product is updated
    And the product metadata is correct
  
  Scenario: Cancel Sale
    Given the product state is 'unsold'
    When I click the 'cancel' button
    Then my deposit is returned
    And the product state is 'ended'

  Scenario: Refund Product
    Given the product state is 'pending'
    When I click the 'refund' button
    Then my deposit is returned
    And the product buyer's fee is returned
    And the product buyer's deposit is returned
    And the product state is 'ended'
```

*User Story: Product Buyer*

```gherkin

Feature: Purchase Product

  Buyers should be able to buy products if they are still up for sale
  and confirm receipt in order to have their deposit returned
  
  Background:
    As a Buyer
    And I am on a product page

  Scenario: Purchase Product  
    Given the product state is 'unsold'
    When I click the 'but it now' button
    Then my fee and deposit is transferred
    And the product state is 'pending'
    And my address is the same as the product 'buyer' address

  Scenario: Confirm Receipt
    Given that I am the buyer of the product
    And the product state is 'pending'
    When I click the 'confirm receipt' button
    Then my deposit is returned
    And the product seller receives my fee and their deposit
```
