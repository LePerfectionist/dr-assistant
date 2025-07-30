// import React from 'react';
// import { WithContext as ReactTags } from 'react-tag-input';
// import './DependencyInput.css'; // We'll add styles for this

// const KeyCodes = {
//   comma: 188,
//   enter: 13,
// };

// const delimiters = [KeyCodes.comma, KeyCodes.enter];

// function DependencyInput({ tags, setTags, suggestions }) {
//   const handleDelete = (i) => {
//     setTags(tags.filter((tag, index) => index !== i));
//   };

//   const handleAddition = (tag) => {
//     // Prevent adding duplicates
//     if (!tags.some(t => t.id === tag.id)) {
//       setTags([...tags, tag]);
//     }
//   };

//   return (
//     <div className="dependency-input-container">
//       <ReactTags
//         tags={tags}
//         suggestions={suggestions}
//         handleDelete={handleDelete}
//         handleAddition={handleAddition}
//         delimiters={delimiters}
//         placeholder="Add a dependency and press Enter"
//         allowUnique={true}
//         minQueryLength={1}
//         allowDragDrop={false}
//         classNames={{
//           tagInputField: 'ReactTags__tagInputField'
//         }}
//       />
//     </div>
//   );
// }

// export default DependencyInput;

import React from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import './DependencyInput.css';

const KeyCodes = {
  comma: 188,
  enter: 13,
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

function DependencyInput({ tags, setTags, suggestions }) {
  const handleDelete = (i) => {
    setTags(tags.filter((tag, index) => index !== i));
  };

  const handleAddition = (tag) => {
    if (!tags.some(t => t.id === tag.id)) {
      setTags([...tags, tag]);
    }
  };

  return (
    <div className="dependency-input-container">
      <ReactTags
        tags={tags}
        suggestions={suggestions}
        handleDelete={handleDelete}
        handleAddition={handleAddition}
        delimiters={delimiters}
        placeholder="Add dependencies (type to search alerts)"
        allowUnique={true}
        minQueryLength={1}
        allowDragDrop={false}
        classNames={{
          tags: 'ReactTags__tags',
          tagInput: 'ReactTags__tagInput',
          tagInputField: 'ReactTags__tagInputField',
          selected: 'ReactTags__selected',
          tag: 'ReactTags__tag',
          remove: 'ReactTags__remove',
          suggestions: 'ReactTags__suggestions',
          activeSuggestion: 'ReactTags__activeSuggestion'
        }}
      />
    </div>
  );
}

export default DependencyInput;