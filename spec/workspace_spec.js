

var dashboard = require('./helpers/dashboard'),
    altKey = require('./helpers/utils').altKey;

describe('workspace', () => {
    beforeEach(() => {
        dashboard.openDashboard();
    });

    it('can switch views by keyboard', () => {
        // wait for icons
        browser.wait(() => element(by.className('big-icon-view')).isDisplayed(), 2000);

        // Can switch to monitoring view by pressing alt + m
        altKey('m');
        expect(browser.getLocationAbsUrl()).toMatch('/workspace/monitoring');

        // Can switch to spiked view by pressing alt + x
        altKey('x');
        expect(browser.getLocationAbsUrl()).toMatch('/workspace/spike-monitoring');

        // Can switch to personal view by pressing alt + p
        altKey('p');
        expect(browser.getLocationAbsUrl()).toMatch('/workspace/personal');

        // Can switch to search view by pressing alt + s
        altKey('f');
        expect(browser.getLocationAbsUrl()).toMatch('/search');

        // Can get back to dashboard by pressing alt + h
        altKey('h');
        expect(browser.getLocationAbsUrl()).toMatch('/workspace');
    });
});
