import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe('Multiplayer P2P Flow', () => {
    let hostContext: BrowserContext;
    let playerContext: BrowserContext;
    let hostPage: Page;
    let playerPage: Page;

    test.beforeAll(async ({ browser }) => {
        hostContext = await browser.newContext();
        await hostContext.addInitScript(() => {
            window.localStorage.setItem('onboardingCompleted', 'true');
            window.localStorage.setItem('userName', 'HostUser');
        });

        playerContext = await browser.newContext();
        await playerContext.addInitScript(() => {
            window.localStorage.setItem('onboardingCompleted', 'true');
            window.localStorage.setItem('userName', 'JoinerUser');
        });

        hostPage = await hostContext.newPage();
        playerPage = await playerContext.newPage();

    });


    test.afterAll(async () => {
        await hostContext.close();
        await playerContext.close();
    });

    test('Host creates room and Player joins', async () => {
        // 1. Host goes to Multiplayer
        await hostPage.goto('/multiplayer');
        await expect(hostPage.getByText('Multiplayer Quiz')).toBeVisible();

        await hostPage.getByPlaceholder('Enter your name').fill('HostUser');

        await hostPage.getByRole('button', { name: 'Create New Game' }).click();

        // Wait for Room Code
        await expect(hostPage.getByText('Room:', { exact: false })).toBeVisible({ timeout: 10000 });
        const roomCodeText = await hostPage.getByText('Room:', { exact: false }).textContent();
        const roomCode = roomCodeText?.split(': ')[1].trim();
        console.log('Room Code generated:', roomCode);
        expect(roomCode).toBeTruthy();

        // 2. Player joins
        await playerPage.goto('/multiplayer');
        await playerPage.getByPlaceholder('Enter your name').fill('JoinerUser');
        await playerPage.getByPlaceholder('Enter 6-character code').fill(roomCode!);
        await playerPage.getByRole('button', { name: 'Join Game' }).click();

        // 3. Verify Player Joined in Lobby
        // Host sees player
        await expect(hostPage.getByText('JoinerUser')).toBeVisible({ timeout: 10000 });
        // Player sees lobby
        await expect(playerPage.getByText(`Room: ${roomCode}`)).toBeVisible();
        await expect(playerPage.getByText('HostUser (Host)')).toBeVisible();

        // 4. Host selects Quiz and Starts
        await hostPage.getByRole('button', { name: 'Select Quiz' }).click();

        // Expand Category
        await hostPage.getByText('🌐 Language').click();

        // Select Quiz
        await hostPage.getByText('Advanced Finnish Language & Complex Grammar').first().click();

        // Ensure "Start Game" becomes enabled
        await expect(hostPage.getByRole('button', { name: 'Start Game' })).toBeEnabled();
        await hostPage.getByRole('button', { name: 'Start Game' }).click();

        // 5. Verify Game Started
        await expect(hostPage.getByText('Question 1')).toBeVisible();
        await expect(playerPage.getByText('Question 1')).toBeVisible();
    });
});
