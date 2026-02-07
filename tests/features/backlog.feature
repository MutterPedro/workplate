Feature: Backlog
  As a senior engineer
  I want to track future work in a backlog
  So that I can plan ahead without cluttering my plate

  Scenario: View empty backlog
    Given I have no tasks
    When I view Backlog
    Then I should see "Backlog is empty"

  Scenario: Add a task to Backlog
    Given I have no tasks
    When I view Backlog
    And I click "Add task"
    And I enter "Research new framework" as the task title
    And I submit the form
    Then I should see "Research new framework" in the task list

  Scenario: Backlog tasks don't appear on plate
    Given I have the following tasks in the backlog:
      | title              | priority | size |
      | Future work        | P3       | L    |
    When I view My Plate
    Then I should not see "Future work" in the task list
