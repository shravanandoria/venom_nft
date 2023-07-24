import React from "react";

const Gallery = ({ collectionsItems, title, listIsEmpty, isLoading }) => {
  return (
    <div className="lots">
      {title && <h1>{title}</h1>}
      {listIsEmpty && <h1>The list is empty</h1>}
      <div className="lots__list">
        {collectionsItems?.map((item, index) => (
          <div className="lots__item" key={`${index} ${item}`}>
            <img src={item} alt="img" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
