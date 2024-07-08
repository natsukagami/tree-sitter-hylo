package tree_sitter_hylo_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-hylo"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_hylo.Language())
	if language == nil {
		t.Errorf("Error loading Hylo grammar")
	}
}
