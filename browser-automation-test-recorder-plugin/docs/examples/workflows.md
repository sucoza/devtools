# Complete Workflows and Examples

Comprehensive examples demonstrating real-world usage of the Browser Automation Test Recorder Plugin across various scenarios and applications.

## Table of Contents

1. [E-commerce Application Testing](#e-commerce-application-testing)
2. [SaaS Dashboard Testing](#saas-dashboard-testing)
3. [Multi-step Form Testing](#multi-step-form-testing)
4. [API Integration Testing](#api-integration-testing)
5. [Mobile Responsive Testing](#mobile-responsive-testing)
6. [Cross-browser Compatibility](#cross-browser-compatibility)
7. [Performance Testing Workflows](#performance-testing-workflows)
8. [Accessibility Testing Workflows](#accessibility-testing-workflows)

## E-commerce Application Testing

### Complete Shopping Flow Recording

Record and test a complete e-commerce shopping experience from product browsing to checkout completion.

```typescript
// examples/e-commerce/shopping-flow.ts
import { 
  EventRecorder, 
  SelectorEngine, 
  PlaywrightGenerator,
  createBrowserAutomationEventClient 
} from '@tanstack/browser-automation-test-recorder';

export class EcommerceTestingWorkflow {
  private recorder: EventRecorder;
  private eventClient;
  
  constructor() {
    this.eventClient = createBrowserAutomationEventClient();
    const selectorEngine = new SelectorEngine({
      preferredAttributes: ['data-testid', 'data-cy', 'aria-label'],
      enableHealing: true,
      confidenceThreshold: 0.9
    });
    
    this.recorder = new EventRecorder(selectorEngine, this.eventClient);
  }
  
  async recordCompleteShoppingFlow() {
    console.log('🛒 Starting e-commerce shopping flow recording...');
    
    // Start recording with comprehensive options
    await this.recorder.start({
      captureScreenshots: true,
      captureNetwork: true,
      captureConsole: true,
      capturePerformance: true,
      sessionName: 'complete-shopping-flow'
    });
    
    console.log('✅ Recording started. Please perform the following actions:');
    console.log('1. Navigate to homepage');
    console.log('2. Browse product categories');
    console.log('3. Search for specific products');
    console.log('4. View product details');
    console.log('5. Add items to cart');
    console.log('6. Modify cart contents');
    console.log('7. Proceed to checkout');
    console.log('8. Fill shipping information');
    console.log('9. Select payment method');
    console.log('10. Complete purchase');
    
    // Wait for user to complete workflow
    await this.waitForUserCompletion();
    
    // Stop recording
    const events = await this.recorder.stop();
    console.log(`✅ Recording completed! Captured ${events.length} events.`);
    
    return events;
  }
  
  async generateTestCode(events, options = {}) {
    const generator = new PlaywrightGenerator({
      template: 'modern-typescript',
      pageObjectModel: true,
      includes: ['assertions', 'waits', 'screenshots'],
      ...options
    });
    
    const testCode = await generator.generate(events, {
      testName: 'Complete Shopping Flow',
      baseUrl: 'https://your-ecommerce-site.com',
      description: 'Tests the complete user journey from product discovery to purchase completion'
    });
    
    return testCode;
  }
  
  private async waitForUserCompletion(): Promise<void> {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        const input = prompt('Type "done" when you have completed the shopping flow, or "continue" to keep recording:');
        if (input?.toLowerCase() === 'done') {
          resolve();
        } else {
          setTimeout(checkCompletion, 1000);
        }
      };
      
      setTimeout(checkCompletion, 2000);
    });
  }
}

// Usage
const workflow = new EcommerceTestingWorkflow();
const events = await workflow.recordCompleteShoppingFlow();
const testCode = await workflow.generateTestCode(events);

console.log('Generated Test Code:');
console.log(testCode);
```

### Generated Playwright Test Example

```typescript
// tests/e2e/shopping-flow.spec.ts
import { test, expect } from '@playwright/test';
import { ShoppingPage } from '../page-objects/shopping-page';

test.describe('E-commerce Shopping Flow', () => {
  let shoppingPage: ShoppingPage;
  
  test.beforeEach(async ({ page }) => {
    shoppingPage = new ShoppingPage(page);
    await shoppingPage.goto();
  });
  
  test('complete shopping journey', async ({ page }) => {
    // Product discovery
    await test.step('Browse and search products', async () => {
      await shoppingPage.navigateToCategory('electronics');
      await shoppingPage.searchForProduct('wireless headphones');
      await expect(shoppingPage.productGrid).toBeVisible();
    });
    
    // Product selection
    await test.step('Select and view product details', async () => {
      await shoppingPage.clickFirstProduct();
      await expect(shoppingPage.productTitle).toContainText('headphones');
      await expect(shoppingPage.productPrice).toBeVisible();
      await expect(shoppingPage.addToCartButton).toBeEnabled();
    });
    
    // Cart management
    await test.step('Add to cart and modify quantity', async () => {
      await shoppingPage.addToCart();
      await expect(shoppingPage.cartNotification).toBeVisible();
      await shoppingPage.viewCart();
      await shoppingPage.updateQuantity(2);
      await expect(shoppingPage.cartTotal).toContainText('$');
    });
    
    // Checkout process
    await test.step('Complete checkout process', async () => {
      await shoppingPage.proceedToCheckout();
      
      // Shipping information
      await shoppingPage.fillShippingInfo({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        address: '123 Main St',
        city: 'New York',
        zipCode: '10001'
      });
      
      // Payment information
      await shoppingPage.selectPaymentMethod('credit-card');
      await shoppingPage.fillPaymentInfo({
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        nameOnCard: 'John Doe'
      });
      
      // Complete purchase
      await shoppingPage.completePurchase();
      await expect(shoppingPage.orderConfirmation).toBeVisible();
      await expect(shoppingPage.orderNumber).toMatch(/^ORD-\d+$/);
    });
    
    // Verification
    await test.step('Verify order completion', async () => {
      const orderNumber = await shoppingPage.getOrderNumber();
      expect(orderNumber).toBeTruthy();
      
      // Verify confirmation email would be sent (mock API call)
      const emailSent = await shoppingPage.verifyConfirmationEmail(orderNumber);
      expect(emailSent).toBe(true);
    });
  });
  
  test('cart persistence across sessions', async ({ page, context }) => {
    // Add items to cart
    await shoppingPage.searchForProduct('laptop');
    await shoppingPage.clickFirstProduct();
    await shoppingPage.addToCart();
    
    // Create new context (simulate new session)
    const newPage = await context.newPage();
    const newShoppingPage = new ShoppingPage(newPage);
    await newShoppingPage.goto();
    
    // Verify cart contents persist
    await newShoppingPage.viewCart();
    await expect(newShoppingPage.cartItems).toHaveCount(1);
  });
});
```

### Page Object Model Implementation

```typescript
// page-objects/shopping-page.ts
import { Page, Locator, expect } from '@playwright/test';

export class ShoppingPage {
  readonly page: Page;
  
  // Navigation
  readonly homeLink: Locator;
  readonly categoryMenu: Locator;
  readonly searchBox: Locator;
  readonly searchButton: Locator;
  
  // Product display
  readonly productGrid: Locator;
  readonly productCards: Locator;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly productImage: Locator;
  
  // Product details
  readonly addToCartButton: Locator;
  readonly quantitySelector: Locator;
  readonly productDescription: Locator;
  readonly productReviews: Locator;
  
  // Cart
  readonly cartIcon: Locator;
  readonly cartNotification: Locator;
  readonly cartItems: Locator;
  readonly cartTotal: Locator;
  readonly checkoutButton: Locator;
  
  // Checkout
  readonly shippingForm: Locator;
  readonly paymentForm: Locator;
  readonly orderSummary: Locator;
  readonly placeOrderButton: Locator;
  
  // Confirmation
  readonly orderConfirmation: Locator;
  readonly orderNumber: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Initialize locators
    this.homeLink = page.locator('[data-testid="home-link"]');
    this.categoryMenu = page.locator('[data-testid="category-menu"]');
    this.searchBox = page.locator('[data-testid="search-input"]');
    this.searchButton = page.locator('[data-testid="search-button"]');
    
    this.productGrid = page.locator('[data-testid="product-grid"]');
    this.productCards = page.locator('[data-testid="product-card"]');
    this.productTitle = page.locator('[data-testid="product-title"]');
    this.productPrice = page.locator('[data-testid="product-price"]');
    
    this.addToCartButton = page.locator('[data-testid="add-to-cart"]');
    this.cartIcon = page.locator('[data-testid="cart-icon"]');
    this.cartNotification = page.locator('[data-testid="cart-notification"]');
    
    this.orderConfirmation = page.locator('[data-testid="order-confirmation"]');
    this.orderNumber = page.locator('[data-testid="order-number"]');
  }
  
  async goto() {
    await this.page.goto('/');
    await expect(this.homeLink).toBeVisible();
  }
  
  async navigateToCategory(category: string) {
    await this.categoryMenu.click();
    await this.page.locator(`[data-testid="category-${category}"]`).click();
    await this.page.waitForLoadState('networkidle');
  }
  
  async searchForProduct(searchTerm: string) {
    await this.searchBox.fill(searchTerm);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }
  
  async clickFirstProduct() {
    await this.productCards.first().click();
    await expect(this.productTitle).toBeVisible();
  }
  
  async addToCart() {
    await this.addToCartButton.click();
    await expect(this.cartNotification).toBeVisible();
  }
  
  async viewCart() {
    await this.cartIcon.click();
    await this.page.waitForLoadState('networkidle');
  }
  
  async updateQuantity(quantity: number) {
    const quantityInput = this.page.locator('[data-testid="quantity-input"]');
    await quantityInput.fill(quantity.toString());
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }
  
  async proceedToCheckout() {
    await this.checkoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }
  
  async fillShippingInfo(info: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    zipCode: string;
  }) {
    await this.page.locator('[data-testid="first-name"]').fill(info.firstName);
    await this.page.locator('[data-testid="last-name"]').fill(info.lastName);
    await this.page.locator('[data-testid="email"]').fill(info.email);
    await this.page.locator('[data-testid="address"]').fill(info.address);
    await this.page.locator('[data-testid="city"]').fill(info.city);
    await this.page.locator('[data-testid="zip-code"]').fill(info.zipCode);
  }
  
  async selectPaymentMethod(method: string) {
    await this.page.locator(`[data-testid="payment-${method}"]`).click();
  }
  
  async fillPaymentInfo(info: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    nameOnCard: string;
  }) {
    await this.page.locator('[data-testid="card-number"]').fill(info.cardNumber);
    await this.page.locator('[data-testid="expiry-date"]').fill(info.expiryDate);
    await this.page.locator('[data-testid="cvv"]').fill(info.cvv);
    await this.page.locator('[data-testid="name-on-card"]').fill(info.nameOnCard);
  }
  
  async completePurchase() {
    await this.placeOrderButton.click();
    await this.page.waitForLoadState('networkidle');
  }
  
  async getOrderNumber(): Promise<string> {
    return await this.orderNumber.textContent() || '';
  }
  
  async verifyConfirmationEmail(orderNumber: string): Promise<boolean> {
    // Mock API call to verify email service
    const response = await this.page.request.get(`/api/orders/${orderNumber}/email-status`);
    const data = await response.json();
    return data.emailSent === true;
  }
}
```

## SaaS Dashboard Testing

### Dashboard Workflow Recording

```typescript
// examples/saas-dashboard/dashboard-workflow.ts
export class SaasDashboardWorkflow {
  private recorder: EventRecorder;
  
  async recordDashboardInteractions() {
    await this.recorder.start({
      captureScreenshots: true,
      captureNetwork: true,
      capturePerformance: true,
      ignoredEvents: ['mousemove', 'scroll'], // Focus on meaningful interactions
      sessionName: 'saas-dashboard-workflow'
    });
    
    console.log('📊 Recording SaaS dashboard workflow...');
    console.log('Please perform these actions:');
    console.log('1. Login to dashboard');
    console.log('2. Navigate between different sections');
    console.log('3. Create new resources (users, projects, etc.)');
    console.log('4. Use filters and search functionality');
    console.log('5. Export data or reports');
    console.log('6. Modify settings');
    console.log('7. Test collaboration features');
    
    await this.waitForCompletion();
    return await this.recorder.stop();
  }
}
```

### Generated Dashboard Tests

```typescript
// tests/dashboard/dashboard-management.spec.ts
import { test, expect } from '@playwright/test';
import { DashboardPage } from '../page-objects/dashboard-page';

test.describe('SaaS Dashboard Management', () => {
  let dashboardPage: DashboardPage;
  
  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.loginAsAdmin();
  });
  
  test('complete project management workflow', async () => {
    await test.step('Create new project', async () => {
      await dashboardPage.navigateToProjects();
      await dashboardPage.createProject({
        name: 'Test Project',
        description: 'Automated test project',
        team: 'Development Team',
        deadline: '2024-12-31'
      });
      
      await expect(dashboardPage.successNotification).toBeVisible();
      await expect(dashboardPage.projectsList).toContainText('Test Project');
    });
    
    await test.step('Manage team members', async () => {
      await dashboardPage.openProject('Test Project');
      await dashboardPage.addTeamMember('john.doe@example.com', 'Developer');
      await dashboardPage.addTeamMember('jane.smith@example.com', 'Designer');
      
      await expect(dashboardPage.teamMembersList).toHaveCount(2);
    });
    
    await test.step('Configure project settings', async () => {
      await dashboardPage.openProjectSettings();
      await dashboardPage.enableFeature('api-access');
      await dashboardPage.setPermissions('team-read-write');
      await dashboardPage.saveSettings();
      
      await expect(dashboardPage.settingsSaved).toBeVisible();
    });
    
    await test.step('Generate and export reports', async () => {
      await dashboardPage.navigateToReports();
      await dashboardPage.selectDateRange('last-30-days');
      await dashboardPage.filterByProject('Test Project');
      await dashboardPage.exportReport('pdf');
      
      await expect(dashboardPage.downloadStarted).toBeVisible();
    });
  });
  
  test('user management workflow', async () => {
    await dashboardPage.navigateToUsers();
    
    // Bulk user operations
    await dashboardPage.selectMultipleUsers(['user1', 'user2', 'user3']);
    await dashboardPage.bulkUpdateRole('Contributor');
    await expect(dashboardPage.bulkUpdateSuccess).toBeVisible();
    
    // User permissions
    await dashboardPage.openUserDetails('user1');
    await dashboardPage.grantPermission('project-create');
    await dashboardPage.revokePermission('admin-access');
    await dashboardPage.saveUserPermissions();
  });
});
```

## Multi-step Form Testing

### Complex Form Recording

```typescript
// examples/forms/multi-step-form.ts
export class MultiStepFormWorkflow {
  async recordFormCompletion() {
    console.log('📝 Recording multi-step form workflow...');
    console.log('This will record:');
    console.log('- Form validation at each step');
    console.log('- Navigation between steps');
    console.log('- Error handling and recovery');
    console.log('- Final submission process');
    
    await this.recorder.start({
      captureScreenshots: true,
      captureConsole: true, // Capture validation errors
      debounceDelay: 200, // Allow for validation feedback
      sessionName: 'multi-step-form'
    });
    
    // Record form completion
    await this.waitForFormCompletion();
    return await this.recorder.stop();
  }
  
  async generateFormTests(events) {
    const generator = new PlaywrightGenerator({
      template: 'form-testing',
      includes: ['validation', 'error-handling', 'accessibility']
    });
    
    return await generator.generate(events, {
      testName: 'Multi-step Form Validation',
      description: 'Comprehensive form testing including validation and error scenarios'
    });
  }
}
```

### Generated Form Tests

```typescript
// tests/forms/multi-step-form.spec.ts
import { test, expect } from '@playwright/test';
import { MultiStepFormPage } from '../page-objects/multi-step-form-page';

test.describe('Multi-step Form Testing', () => {
  let formPage: MultiStepFormPage;
  
  test.beforeEach(async ({ page }) => {
    formPage = new MultiStepFormPage(page);
    await formPage.goto();
  });
  
  test('complete form submission happy path', async () => {
    // Step 1: Personal Information
    await test.step('Fill personal information', async () => {
      await formPage.fillPersonalInfo({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        dateOfBirth: '1990-01-01'
      });
      
      await formPage.nextStep();
      await expect(formPage.currentStep).toHaveText('2');
    });
    
    // Step 2: Address Information
    await test.step('Fill address information', async () => {
      await formPage.fillAddressInfo({
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States'
      });
      
      await formPage.nextStep();
      await expect(formPage.currentStep).toHaveText('3');
    });
    
    // Step 3: Preferences
    await test.step('Set preferences', async () => {
      await formPage.selectPreferences(['newsletter', 'sms-updates']);
      await formPage.selectSubscriptionTier('premium');
      
      await formPage.nextStep();
      await expect(formPage.currentStep).toHaveText('4');
    });
    
    // Step 4: Review and Submit
    await test.step('Review and submit', async () => {
      await expect(formPage.reviewSection).toContainText('John Doe');
      await expect(formPage.reviewSection).toContainText('john.doe@example.com');
      await expect(formPage.reviewSection).toContainText('123 Main St');
      
      await formPage.submitForm();
      await expect(formPage.successMessage).toBeVisible();
    });
  });
  
  test('form validation error scenarios', async () => {
    // Test empty form submission
    await test.step('Validate required fields', async () => {
      await formPage.nextStep(); // Try to proceed without filling anything
      
      await expect(formPage.validationErrors).toContainText('First name is required');
      await expect(formPage.validationErrors).toContainText('Email is required');
    });
    
    // Test invalid email format
    await test.step('Validate email format', async () => {
      await formPage.fillField('email', 'invalid-email');
      await formPage.nextStep();
      
      await expect(formPage.fieldError('email')).toContainText('Please enter a valid email');
    });
    
    // Test phone number format
    await test.step('Validate phone format', async () => {
      await formPage.fillField('phone', '123');
      await formPage.nextStep();
      
      await expect(formPage.fieldError('phone')).toContainText('Please enter a valid phone number');
    });
  });
  
  test('form navigation and state persistence', async () => {
    // Fill first step
    await formPage.fillPersonalInfo({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com'
    });
    await formPage.nextStep();
    
    // Fill second step partially
    await formPage.fillField('street', '456 Oak Ave');
    await formPage.fillField('city', 'Boston');
    
    // Navigate back to first step
    await formPage.previousStep();
    await expect(formPage.getFieldValue('firstName')).toBe('Jane');
    
    // Navigate forward again
    await formPage.nextStep();
    await expect(formPage.getFieldValue('street')).toBe('456 Oak Ave');
    await expect(formPage.getFieldValue('city')).toBe('Boston');
  });
  
  test('accessibility compliance', async () => {
    // Test keyboard navigation
    await formPage.navigateWithKeyboard();
    await expect(formPage.focusedElement).toHaveAttribute('data-testid', 'first-name');
    
    // Test screen reader labels
    await expect(formPage.getField('firstName')).toHaveAttribute('aria-label');
    await expect(formPage.getField('email')).toHaveAttribute('aria-describedby');
    
    // Test error announcements
    await formPage.submitInvalidForm();
    await expect(formPage.errorAnnouncement).toHaveAttribute('aria-live', 'polite');
  });
});
```

## API Integration Testing

### Recording API-dependent Workflows

```typescript
// examples/api-integration/api-workflow.ts
export class APIIntegrationWorkflow {
  private recorder: EventRecorder;
  private apiInterceptor: ApiInterceptor;
  
  constructor() {
    this.apiInterceptor = new ApiInterceptor({
      captureHeaders: true,
      captureBody: true,
      maskSensitiveData: ['password', 'token', 'apiKey']
    });
  }
  
  async recordAPIWorkflow() {
    await this.recorder.start({
      captureNetwork: true,
      captureScreenshots: true,
      sessionName: 'api-integration-workflow'
    });
    
    // Setup API interception
    await this.apiInterceptor.intercept([
      '/api/users',
      '/api/projects',
      '/api/data/export',
      '/graphql'
    ]);
    
    console.log('🔌 Recording API integration workflow...');
    console.log('Actions to perform:');
    console.log('1. Load data from API endpoints');
    console.log('2. Create new resources via API');
    console.log('3. Update existing data');
    console.log('4. Handle API errors gracefully');
    console.log('5. Test offline scenarios');
    
    await this.waitForCompletion();
    
    const events = await this.recorder.stop();
    const apiCalls = await this.apiInterceptor.getRecordedCalls();
    
    return { events, apiCalls };
  }
  
  async generateAPITests({ events, apiCalls }) {
    const generator = new PlaywrightGenerator({
      template: 'api-integration',
      includes: ['mocking', 'error-handling', 'offline-scenarios']
    });
    
    // Generate tests with API mocking
    const testCode = await generator.generate(events, {
      testName: 'API Integration Testing',
      apiCalls,
      mockStrategy: 'msw' // Mock Service Worker
    });
    
    return testCode;
  }
}
```

### Generated API Tests

```typescript
// tests/api-integration/data-management.spec.ts
import { test, expect } from '@playwright/test';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  // Mock successful API responses
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]));
  }),
  
  rest.post('/api/users', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: 3, ...req.body }));
  }),
  
  rest.put('/api/users/:id', (req, res, ctx) => {
    return res(ctx.json({ id: req.params.id, ...req.body }));
  })
);

test.describe('API Integration Testing', () => {
  test.beforeAll(() => server.listen());
  test.afterEach(() => server.resetHandlers());
  test.afterAll(() => server.close());
  
  test('successful data loading and display', async ({ page }) => {
    await page.goto('/users');
    
    // Wait for API call and data display
    await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-item"]')).toHaveCount(2);
    await expect(page.locator('text=John Doe')).toBeVisible();
  });
  
  test('create new user via API', async ({ page }) => {
    await page.goto('/users');
    
    // Fill create user form
    await page.click('[data-testid="add-user-button"]');
    await page.fill('[data-testid="name-input"]', 'New User');
    await page.fill('[data-testid="email-input"]', 'newuser@example.com');
    
    // Submit and verify
    await page.click('[data-testid="submit-button"]');
    await expect(page.locator('text=User created successfully')).toBeVisible();
    await expect(page.locator('text=New User')).toBeVisible();
  });
  
  test('API error handling', async ({ page }) => {
    // Mock API error
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
      })
    );
    
    await page.goto('/users');
    
    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load users');
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });
  
  test('offline scenario handling', async ({ page, context }) => {
    await page.goto('/users');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to create user while offline
    await page.click('[data-testid="add-user-button"]');
    await page.fill('[data-testid="name-input"]', 'Offline User');
    await page.click('[data-testid="submit-button"]');
    
    // Verify offline handling
    await expect(page.locator('[data-testid="offline-notice"]')).toBeVisible();
    await expect(page.locator('text=Changes will be saved when connection is restored')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Verify sync
    await expect(page.locator('text=Changes synchronized')).toBeVisible();
  });
  
  test('GraphQL API integration', async ({ page }) => {
    // Mock GraphQL endpoint
    server.use(
      rest.post('/graphql', (req, res, ctx) => {
        const { query } = req.body;
        
        if (query.includes('getUsers')) {
          return res(ctx.json({
            data: {
              users: [
                { id: '1', name: 'GraphQL User', email: 'gql@example.com' }
              ]
            }
          }));
        }
        
        return res(ctx.json({ errors: [{ message: 'Unknown query' }] }));
      })
    );
    
    await page.goto('/graphql-users');
    await expect(page.locator('text=GraphQL User')).toBeVisible();
  });
});
```

## Mobile Responsive Testing

### Recording Mobile Interactions

```typescript
// examples/mobile-responsive/mobile-workflow.ts
export class MobileResponsiveWorkflow {
  private recorder: EventRecorder;
  
  async recordMobileInteractions() {
    await this.recorder.start({
      captureScreenshots: true,
      capturePerformance: true,
      captureViewportChanges: true,
      sessionName: 'mobile-responsive-workflow'
    });
    
    console.log('📱 Recording mobile responsive workflow...');
    console.log('Please test these mobile interactions:');
    console.log('1. Touch gestures (tap, swipe, pinch)');
    console.log('2. Navigation drawer/hamburger menu');
    console.log('3. Mobile form input and keyboards');
    console.log('4. Responsive layout changes');
    console.log('5. Touch-specific UI elements');
    
    await this.waitForCompletion();
    return await this.recorder.stop();
  }
}
```

### Generated Mobile Tests

```typescript
// tests/mobile/responsive-design.spec.ts
import { test, expect, devices } from '@playwright/test';

const mobileDevices = [
  devices['iPhone 13'],
  devices['Samsung Galaxy S21'],
  devices['iPad'],
  devices['iPhone 13 landscape']
];

mobileDevices.forEach(device => {
  test.describe(`Mobile Testing - ${device.name}`, () => {
    test.use({ ...device });
    
    test('responsive navigation', async ({ page }) => {
      await page.goto('/');
      
      // Mobile navigation should show hamburger menu
      await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
      
      // Test hamburger menu functionality
      await page.tap('[data-testid="hamburger-menu"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Test menu item navigation
      await page.tap('[data-testid="menu-item-products"]');
      await expect(page).toHaveURL(/.*products/);
    });
    
    test('touch gestures and interactions', async ({ page }) => {
      await page.goto('/gallery');
      
      // Test touch scroll
      await page.touchscreen.tap(100, 200);
      
      // Test swipe gestures on carousel
      const carousel = page.locator('[data-testid="image-carousel"]');
      await carousel.swipeLeft();
      await expect(page.locator('[data-testid="carousel-item-2"]')).toBeVisible();
      
      // Test pinch to zoom
      await page.touchscreen.tap(200, 300);
      // Note: Pinch gesture simulation would require custom implementation
    });
    
    test('mobile form interactions', async ({ page }) => {
      await page.goto('/contact');
      
      // Test mobile keyboard appearance
      await page.tap('[data-testid="email-input"]');
      
      // Mobile keyboards change viewport
      await page.fill('[data-testid="email-input"]', 'mobile@test.com');
      await page.fill('[data-testid="message-textarea"]', 'Mobile test message');
      
      // Test form submission on mobile
      await page.tap('[data-testid="submit-button"]');
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });
});

test.describe('Responsive Breakpoints', () => {
  const viewports = [
    { width: 320, height: 568, name: 'Mobile Portrait' },
    { width: 568, height: 320, name: 'Mobile Landscape' },
    { width: 768, height: 1024, name: 'Tablet Portrait' },
    { width: 1024, height: 768, name: 'Tablet Landscape' },
    { width: 1200, height: 800, name: 'Desktop' }
  ];
  
  viewports.forEach(viewport => {
    test(`layout adaptation - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      if (viewport.width < 768) {
        // Mobile layout
        await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();
        await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
      } else if (viewport.width < 1024) {
        // Tablet layout
        await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
      } else {
        // Desktop layout
        await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
        await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      }
    });
  });
});
```

## Cross-browser Compatibility

### Recording Cross-browser Workflows

```typescript
// examples/cross-browser/compatibility-workflow.ts
export class CrossBrowserWorkflow {
  private recorder: EventRecorder;
  
  async recordCrossBrowserScenarios() {
    console.log('🌐 Recording cross-browser compatibility scenarios...');
    
    const scenarios = [
      'CSS feature compatibility',
      'JavaScript API support',
      'Form behavior differences',
      'Event handling variations',
      'Performance characteristics'
    ];
    
    await this.recorder.start({
      captureScreenshots: true,
      captureBrowserInfo: true,
      capturePerformance: true,
      sessionName: 'cross-browser-compatibility'
    });
    
    for (const scenario of scenarios) {
      console.log(`Testing: ${scenario}`);
      await this.testScenario(scenario);
    }
    
    return await this.recorder.stop();
  }
  
  private async testScenario(scenario: string) {
    // Add manual event to mark scenario
    this.recorder.addCustomEvent({
      type: 'scenario-start',
      data: { scenario, browser: navigator.userAgent }
    });
  }
}
```

### Generated Cross-browser Tests

```typescript
// tests/cross-browser/compatibility.spec.ts
import { test, expect, webkit, chromium, firefox } from '@playwright/test';

const browsers = [
  { name: 'Chromium', engine: chromium },
  { name: 'Firefox', engine: firefox },
  { name: 'WebKit', engine: webkit }
];

browsers.forEach(({ name, engine }) => {
  test.describe(`Cross-browser Testing - ${name}`, () => {
    let browserInstance;
    
    test.beforeAll(async () => {
      browserInstance = await engine.launch();
    });
    
    test.afterAll(async () => {
      await browserInstance.close();
    });
    
    test('CSS Grid and Flexbox compatibility', async () => {
      const page = await browserInstance.newPage();
      await page.goto('/layouts');
      
      // Test CSS Grid support
      const gridContainer = page.locator('[data-testid="grid-container"]');
      const gridItemsCount = await gridContainer.locator('.grid-item').count();
      
      // Verify grid layout works across browsers
      expect(gridItemsCount).toBeGreaterThan(0);
      
      // Check computed styles
      const gridDisplay = await gridContainer.evaluate(el => 
        window.getComputedStyle(el).display
      );
      expect(gridDisplay).toBe('grid');
      
      await page.close();
    });
    
    test('JavaScript APIs compatibility', async () => {
      const page = await browserInstance.newPage();
      await page.goto('/apis');
      
      // Test modern JavaScript features
      const apiSupport = await page.evaluate(() => {
        return {
          fetch: typeof fetch !== 'undefined',
          intersectionObserver: 'IntersectionObserver' in window,
          webGL: !!document.createElement('canvas').getContext('webgl'),
          localStorage: typeof Storage !== 'undefined'
        };
      });
      
      expect(apiSupport.fetch).toBe(true);
      expect(apiSupport.localStorage).toBe(true);
      
      await page.close();
    });
    
    test('form behavior consistency', async () => {
      const page = await browserInstance.newPage();
      await page.goto('/forms');
      
      // Test HTML5 form validation
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="submit-button"]');
      
      // Check if native validation works
      const validationMessage = await page.locator('[data-testid="email-input"]')
        .evaluate(el => el.validationMessage);
      
      expect(validationMessage).toBeTruthy();
      
      await page.close();
    });
    
    test('event handling differences', async () => {
      const page = await browserInstance.newPage();
      await page.goto('/events');
      
      // Test event handling
      await page.click('[data-testid="event-button"]');
      
      const eventResult = await page.textContent('[data-testid="event-result"]');
      expect(eventResult).toContain('Event handled');
      
      await page.close();
    });
  });
});

test.describe('Browser-specific Workarounds', () => {
  test('Safari-specific issues', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');
    
    await page.goto('/safari-issues');
    
    // Test date input fallback for Safari
    const dateInput = page.locator('[data-testid="date-input"]');
    const inputType = await dateInput.getAttribute('type');
    
    if (inputType === 'text') {
      // Safari fallback detected
      await expect(page.locator('[data-testid="date-picker"]')).toBeVisible();
    }
  });
  
  test('Firefox-specific behaviors', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');
    
    await page.goto('/firefox-specific');
    
    // Test Firefox scrollbar behavior
    const scrollbarWidth = await page.evaluate(() => {
      const outer = document.createElement('div');
      outer.style.visibility = 'hidden';
      outer.style.width = '100px';
      outer.style.msOverflowStyle = 'scrollbar';
      
      document.body.appendChild(outer);
      const widthNoScroll = outer.offsetWidth;
      outer.style.overflow = 'scroll';
      
      const inner = document.createElement('div');
      inner.style.width = '100%';
      outer.appendChild(inner);
      
      const widthWithScroll = inner.offsetWidth;
      
      outer.parentNode.removeChild(outer);
      return widthNoScroll - widthWithScroll;
    });
    
    // Firefox typically shows scrollbars
    expect(scrollbarWidth).toBeGreaterThan(0);
  });
});
```

## Performance Testing Workflows

### Performance-focused Recording

```typescript
// examples/performance/performance-workflow.ts
export class PerformanceWorkflow {
  private recorder: EventRecorder;
  private performanceMonitor: PerformanceMonitor;
  
  async recordPerformanceScenarios() {
    this.performanceMonitor = new PerformanceMonitor({
      captureMetrics: ['paint', 'layout', 'memory', 'network'],
      thresholds: {
        firstContentfulPaint: 2000,
        largestContentfulPaint: 2500,
        cumulativeLayoutShift: 0.1
      }
    });
    
    await this.recorder.start({
      capturePerformance: true,
      captureNetworkTimings: true,
      sessionName: 'performance-testing'
    });
    
    console.log('⚡ Recording performance testing scenarios...');
    
    // Test various performance scenarios
    await this.testPageLoadPerformance();
    await this.testInteractionPerformance();
    await this.testLargeDataSets();
    await this.testMemoryUsage();
    
    const events = await this.recorder.stop();
    const performanceData = await this.performanceMonitor.getResults();
    
    return { events, performanceData };
  }
}
```

### Generated Performance Tests

```typescript
// tests/performance/performance-metrics.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Testing', () => {
  test('page load performance', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/performance-test');
    
    // Measure Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime;
            }
            if (entry.name === 'largest-contentful-paint') {
              metrics.lcp = entry.startTime;
            }
          });
          
          resolve(metrics);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    // Assert performance thresholds
    if (metrics.fcp) {
      expect(metrics.fcp).toBeLessThan(2000); // FCP < 2s
    }
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    }
  });
  
  test('interaction performance', async ({ page }) => {
    await page.goto('/interactive-elements');
    
    // Measure interaction timing
    const startTime = Date.now();
    await page.click('[data-testid="heavy-computation-button"]');
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
    const endTime = Date.now();
    
    const interactionTime = endTime - startTime;
    expect(interactionTime).toBeLessThan(100); // Interaction < 100ms
  });
  
  test('memory usage monitoring', async ({ page }) => {
    await page.goto('/memory-test');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Perform memory-intensive operations
    await page.click('[data-testid="load-large-dataset"]');
    await page.waitForSelector('[data-testid="data-loaded"]');
    
    // Check memory usage after operation
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseInMB = memoryIncrease / (1024 * 1024);
    
    // Memory increase should be reasonable
    expect(memoryIncreaseInMB).toBeLessThan(50); // < 50MB increase
  });
  
  test('network performance', async ({ page }) => {
    // Monitor network requests
    const requests = [];
    page.on('request', request => requests.push(request));
    
    await page.goto('/network-heavy-page');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Analyze network requests
    const imageRequests = requests.filter(req => 
      req.resourceType() === 'image'
    );
    const scriptRequests = requests.filter(req => 
      req.resourceType() === 'script'
    );
    
    // Performance assertions
    expect(imageRequests.length).toBeLessThan(20); // Limit image requests
    expect(scriptRequests.length).toBeLessThan(10); // Limit script requests
    
    // Check for optimized images
    for (const request of imageRequests) {
      const url = request.url();
      const hasOptimization = url.includes('webp') || 
                             url.includes('w_') || // Width parameter
                             url.includes('q_'); // Quality parameter
      
      if (!hasOptimization) {
        console.warn(`Unoptimized image: ${url}`);
      }
    }
  });
});
```

## Accessibility Testing Workflows

### Recording Accessibility Scenarios

```typescript
// examples/accessibility/a11y-workflow.ts
export class AccessibilityWorkflow {
  private recorder: EventRecorder;
  private a11yAuditor: AccessibilityAuditor;
  
  async recordAccessibilityScenarios() {
    this.a11yAuditor = new AccessibilityAuditor({
      standards: ['WCAG2.1-AA', 'WCAG2.2-AA'],
      includeWarnings: true
    });
    
    await this.recorder.start({
      captureScreenshots: true,
      captureKeyboardNavigation: true,
      captureScreenReaderEvents: true,
      sessionName: 'accessibility-testing'
    });
    
    console.log('♿ Recording accessibility testing scenarios...');
    console.log('Please test:');
    console.log('1. Keyboard navigation throughout the app');
    console.log('2. Screen reader announcements');
    console.log('3. Focus management');
    console.log('4. Color contrast and visual elements');
    console.log('5. Form accessibility');
    
    await this.waitForCompletion();
    
    const events = await this.recorder.stop();
    const a11yResults = await this.a11yAuditor.audit();
    
    return { events, a11yResults };
  }
}
```

### Generated Accessibility Tests

```typescript
// tests/accessibility/a11y-compliance.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Compliance', () => {
  test('automated accessibility audit', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus').getAttribute('data-testid');
    expect(focusedElement).toBe('skip-to-content');
    
    await page.keyboard.press('Tab');
    focusedElement = await page.locator(':focus').getAttribute('data-testid');
    expect(focusedElement).toBe('main-navigation');
    
    // Test skip links
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });
  
  test('screen reader compatibility', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = await Promise.all(
      headings.map(h => h.evaluate(el => parseInt(el.tagName.slice(1))))
    );
    
    // Verify heading hierarchy (no skipped levels)
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
    
    // Check for landmark roles
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('[role="banner"], header')).toBeVisible();
    await expect(page.locator('[role="contentinfo"], footer')).toBeVisible();
  });
  
  test('form accessibility', async ({ page }) => {
    await page.goto('/contact');
    
    // Check form labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      
      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      } else {
        // Check for aria-label or aria-labelledby
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        
        expect(ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
    
    // Test error announcements
    await page.click('[data-testid="submit-button"]');
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    
    // Check live region for dynamic content
    const liveRegion = await errorMessage.getAttribute('aria-live');
    expect(['polite', 'assertive']).toContain(liveRegion);
  });
  
  test('color contrast compliance', async ({ page }) => {
    await page.goto('/');
    
    // This would typically require a specialized tool
    // Here's a simplified check for common elements
    const textElements = page.locator('p, span, a, button, h1, h2, h3, h4, h5, h6');
    const elementCount = await textElements.count();
    
    for (let i = 0; i < Math.min(elementCount, 10); i++) {
      const element = textElements.nth(i);
      
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Basic check - would need more sophisticated contrast calculation
      expect(styles.color).not.toBe('');
      expect(styles.backgroundColor).toBeDefined();
    }
  });
  
  test('focus management in modal', async ({ page }) => {
    await page.goto('/modal-test');
    
    // Open modal
    await page.click('[data-testid="open-modal"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Focus should be trapped in modal
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    const modalContainer = page.locator('[role="dialog"]');
    
    expect(await modalContainer.locator(focusedElement).count()).toBe(1);
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Focus should return to trigger button
    await expect(page.locator('[data-testid="open-modal"]')).toBeFocused();
  });
});
```

These comprehensive workflow examples demonstrate how the Browser Automation Test Recorder Plugin can be used across various testing scenarios, from simple e-commerce flows to complex accessibility compliance testing. Each example includes both the recording setup and the generated test code, showing the full cycle from user interaction capture to automated test execution.

---

*Continue to [Best Practices Guide](./best-practices.md) for optimization techniques and advanced usage patterns.*