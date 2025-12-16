/**
 * Types of locators supported
 */
export enum LocatorType {
  CSS_SELECTOR = 'CSS_SELECTOR',
  XPATH = 'XPATH',
  ID = 'ID',
  NAME = 'NAME',
  CLASS_NAME = 'CLASS_NAME',
  TAG_NAME = 'TAG_NAME',
  LINK_TEXT = 'LINK_TEXT',
  PARTIAL_LINK_TEXT = 'PARTIAL_LINK_TEXT',

  // Playwright-specific
  GET_BY_ROLE = 'GET_BY_ROLE',
  GET_BY_LABEL = 'GET_BY_LABEL',
  GET_BY_PLACEHOLDER = 'GET_BY_PLACEHOLDER',
  GET_BY_TEXT = 'GET_BY_TEXT',
  GET_BY_ALT_TEXT = 'GET_BY_ALT_TEXT',
  GET_BY_TITLE = 'GET_BY_TITLE',
  GET_BY_TEST_ID = 'GET_BY_TEST_ID',
}

/**
 * Display names for locator types
 */
export const LocatorTypeDisplayNames: Record<LocatorType, string> = {
  [LocatorType.CSS_SELECTOR]: 'CSS Selector',
  [LocatorType.XPATH]: 'XPath',
  [LocatorType.ID]: 'ID',
  [LocatorType.NAME]: 'Name',
  [LocatorType.CLASS_NAME]: 'Class Name',
  [LocatorType.TAG_NAME]: 'Tag Name',
  [LocatorType.LINK_TEXT]: 'Link Text',
  [LocatorType.PARTIAL_LINK_TEXT]: 'Partial Link Text',
  [LocatorType.GET_BY_ROLE]: 'getByRole',
  [LocatorType.GET_BY_LABEL]: 'getByLabel',
  [LocatorType.GET_BY_PLACEHOLDER]: 'getByPlaceholder',
  [LocatorType.GET_BY_TEXT]: 'getByText',
  [LocatorType.GET_BY_ALT_TEXT]: 'getByAltText',
  [LocatorType.GET_BY_TITLE]: 'getByTitle',
  [LocatorType.GET_BY_TEST_ID]: 'getByTestId',
};
