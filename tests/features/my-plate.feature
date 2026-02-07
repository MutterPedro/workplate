Feature: My Plate
  As a senior engineer
  I want to manage active tasks on my plate
  So that I can focus on what matters right now

  Scenario: View empty plate
    Given I have no tasks
    When I view My Plate
    Then I should see "Your plate is empty"

  Scenario: Add a task to My Plate
    Given I have no tasks
    When I view My Plate
    And I click "Add task"
    And I enter "Fix auth bug" as the task title
    And I submit the form
    Then I should see "Fix auth bug" in the task list

  Scenario: View existing tasks
    Given I have the following tasks on my plate:
      | title            | priority | size |
      | Fix auth bug     | P0       | M    |
      | Update docs      | P2       | S    |
    When I view My Plate
    Then I should see "Fix auth bug" in the task list
    And I should see "Update docs" in the task list

  Scenario: Delete a task
    Given I have the following tasks on my plate:
      | title        | priority | size |
      | Remove me    | P3       | S    |
    When I view My Plate
    And I delete the task "Remove me"
    Then I should not see "Remove me" in the task list
