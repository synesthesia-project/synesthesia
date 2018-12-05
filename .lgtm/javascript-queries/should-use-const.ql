/**
 * @name Correct use of Const
 * @description Variable declarations that use let and dont get changed should use const instead
 * @kind problem
 * @problem.severity warning
 * @id should-use-const
 * @precision very-high
 */
import javascript

predicate variableChanges(Variable var) {
  exists(Assignment assign | assign.getLhs() = var.getAnAccess())
  or
  exists(UpdateExpr update | update.getOperand() = var.getAnAccess())
}

from LetStmt stmt, VariableDeclarator decl
where
  stmt.getADecl() = decl and
  not variableChanges(decl.getBindingPattern().(VarRef).getVariable())
select decl, "this let declaration should use a const as it's never re-assigned"
