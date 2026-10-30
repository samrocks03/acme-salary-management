# frozen_string_literal: true

# Domain rule 8: free text is reduced to plain, single-spaced text before validation
# (defence-in-depth against stored XSS). Unlike `strip_tags`, entities are decoded so "R&D" stays "R&D";
# decoding can reveal new markup ("&lt;b&gt;"), so stripping repeats until the text is stable.
module TextNormalizer
  MAX_PASSES = 3
  MARKUP = /[<&]/

  def self.call(value)
    text = value.to_s
    # Fast path (also used by insert_all in the seeds): no tag or entity, nothing to strip.
    return text.squish unless MARKUP.match?(text)

    MAX_PASSES.times do
      stripped = Loofah.fragment(text).text(encode_special_chars: false)
      break if stripped == text

      text = stripped
    end
    text.squish
  end
end
